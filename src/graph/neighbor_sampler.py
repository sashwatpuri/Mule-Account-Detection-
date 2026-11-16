"""
Memory-Efficient Bipartite Neighbor Sampler & Mini-Batch Generator for HeteroFinancialGraphSAGE.

Enables mini-batch training for large-scale financial transaction graphs without requiring
external C++ extensions ('pyg-lib' or 'torch-sparse').
Builds induced 2-hop subgraphs with local node reindexing, sliced feature tensors, and seed masks.
"""
from typing import List, Tuple, Dict, Iterator
import torch
import numpy as np

class BipartiteNeighborSampler:
    """
    2-Hop Bipartite Neighbor Sampler for (Account <-> Counterparty) graphs.
    """
    def __init__(self, 
                 acc_x: torch.Tensor,
                 cp_x: torch.Tensor,
                 edge_index_cp_to_acc: torch.Tensor, 
                 edge_attr_cp_to_acc: torch.Tensor,
                 edge_index_acc_to_cp: torch.Tensor,
                 edge_attr_acc_to_cp: torch.Tensor,
                 labels: torch.Tensor,
                 sample_sizes: List[int] = [15, 10]):
        """
        sample_sizes: [K1, K2]
          K1: max counterparties sampled per seed account (Hop 1)
          K2: max accounts sampled per counterparty (Hop 2)
        """
        self.acc_x = acc_x
        self.cp_x = cp_x
        self.labels = labels
        self.k1 = sample_sizes[0]
        self.k2 = sample_sizes[1]
        self.num_accounts = acc_x.size(0)
        self.num_cps = cp_x.size(0)

        # Store raw edge tensors
        self.edge_index_cp_to_acc = edge_index_cp_to_acc
        self.edge_attr_cp_to_acc = edge_attr_cp_to_acc
        self.edge_index_acc_to_cp = edge_index_acc_to_cp
        self.edge_attr_acc_to_cp = edge_attr_acc_to_cp

        # Build fast adjacency lists:
        # acc -> list of (cp, edge_idx)
        self.acc_to_cp_adj = [[] for _ in range(self.num_accounts)]
        for e_idx in range(edge_index_acc_to_cp.size(1)):
            src = edge_index_acc_to_cp[0, e_idx].item()
            dst = edge_index_acc_to_cp[1, e_idx].item()
            self.acc_to_cp_adj[src].append((dst, e_idx))

        # cp -> list of (acc, edge_idx)
        self.cp_to_acc_adj = [[] for _ in range(self.num_cps)]
        for e_idx in range(edge_index_cp_to_acc.size(1)):
            src = edge_index_cp_to_acc[0, e_idx].item()
            dst = edge_index_cp_to_acc[1, e_idx].item()
            self.cp_to_acc_adj[src].append((dst, e_idx))

    def sample_batch(self, seed_accounts: torch.Tensor, device=None) -> Dict[str, torch.Tensor]:
        """
        Given a batch of seed account indices (1D tensor), extracts the 2-hop induced bipartite subgraph.
        """
        if isinstance(seed_accounts, torch.Tensor):
            seed_list = seed_accounts.tolist()
        else:
            seed_list = list(seed_accounts)

        # 1-hop: sample counterparties connected to seed accounts
        sampled_cps = set()
        for acc in seed_list:
            neighbors = self.acc_to_cp_adj[acc]
            if len(neighbors) > self.k1:
                perm = torch.randperm(len(neighbors))[:self.k1].tolist()
                sampled_cps.update(neighbors[p][0] for p in perm)
            else:
                sampled_cps.update(n[0] for n in neighbors)

        # 2-hop: sample accounts connected to sampled counterparties
        sampled_accounts = set(seed_list)
        for cp in sampled_cps:
            neighbors = self.cp_to_acc_adj[cp]
            if len(neighbors) > self.k2:
                perm = torch.randperm(len(neighbors))[:self.k2].tolist()
                sampled_accounts.update(neighbors[p][0] for p in perm)
            else:
                sampled_accounts.update(n[0] for n in neighbors)

        # Order nodes: Seed accounts placed first for clean indexing
        seed_set = set(seed_list)
        non_seed_accounts = [a for a in sorted(sampled_accounts) if a not in seed_set]
        ordered_accounts = seed_list + non_seed_accounts
        ordered_cps = sorted(sampled_cps)

        acc_map = {global_id: local_idx for local_idx, global_id in enumerate(ordered_accounts)}
        cp_map = {global_id: local_idx for local_idx, global_id in enumerate(ordered_cps)}

        # Seed accounts local indices: [0, 1, ..., len(seed_list) - 1]
        seed_local_indices = torch.arange(len(seed_list), dtype=torch.long)

        # Build induced sub-edges
        # 1. CP -> Acc
        sub_c2a_edges = []
        sub_c2a_attr_indices = []
        for cp in ordered_cps:
            for acc, e_idx in self.cp_to_acc_adj[cp]:
                if acc in acc_map:
                    sub_c2a_edges.append([cp_map[cp], acc_map[acc]])
                    sub_c2a_attr_indices.append(e_idx)

        # 2. Acc -> CP
        sub_a2c_edges = []
        sub_a2c_attr_indices = []
        for acc in ordered_accounts:
            for cp, e_idx in self.acc_to_cp_adj[acc]:
                if cp in cp_map:
                    sub_a2c_edges.append([acc_map[acc], cp_map[cp]])
                    sub_a2c_attr_indices.append(e_idx)

        # Sliced feature tensors
        sub_acc_x = self.acc_x[ordered_accounts]
        sub_cp_x = self.cp_x[ordered_cps] if len(ordered_cps) > 0 else torch.zeros((0, self.cp_x.size(1)))

        sub_edge_index_cp_to_acc = torch.tensor(sub_c2a_edges, dtype=torch.long).t().contiguous() if sub_c2a_edges else torch.empty((2, 0), dtype=torch.long)
        sub_edge_attr_cp_to_acc = self.edge_attr_cp_to_acc[sub_c2a_attr_indices] if sub_c2a_attr_indices else torch.empty((0, self.edge_attr_cp_to_acc.size(1)))

        sub_edge_index_acc_to_cp = torch.tensor(sub_a2c_edges, dtype=torch.long).t().contiguous() if sub_a2c_edges else torch.empty((2, 0), dtype=torch.long)
        sub_edge_attr_acc_to_cp = self.edge_attr_acc_to_cp[sub_a2c_attr_indices] if sub_a2c_attr_indices else torch.empty((0, self.edge_attr_acc_to_cp.size(1)))

        batch_labels = self.labels[seed_list]

        batch_data = {
            "sub_acc_x": sub_acc_x,
            "sub_cp_x": sub_cp_x,
            "sub_edge_index_cp_to_acc": sub_edge_index_cp_to_acc,
            "sub_edge_attr_cp_to_acc": sub_edge_attr_cp_to_acc,
            "sub_edge_index_acc_to_cp": sub_edge_index_acc_to_cp,
            "sub_edge_attr_acc_to_cp": sub_edge_attr_acc_to_cp,
            "seed_local_indices": seed_local_indices,
            "seed_labels": batch_labels,
            "num_seed_nodes": len(seed_list),
            "num_sub_acc_nodes": len(ordered_accounts),
            "num_sub_cp_nodes": len(ordered_cps),
            "num_sub_c2a_edges": sub_edge_index_cp_to_acc.size(1),
            "num_sub_a2c_edges": sub_edge_index_acc_to_cp.size(1),
        }

        if device is not None:
            for k in ["sub_acc_x", "sub_cp_x", "sub_edge_index_cp_to_acc", "sub_edge_attr_cp_to_acc", 
                      "sub_edge_index_acc_to_cp", "sub_edge_attr_acc_to_cp", "seed_local_indices", "seed_labels"]:
                batch_data[k] = batch_data[k].to(device)

        return batch_data

    def get_dataloader(self, target_node_indices: torch.Tensor, batch_size: int = 64, shuffle: bool = True, device=None) -> Iterator[Dict[str, torch.Tensor]]:
        """
        Yields mini-batch subgraphs for a given set of target account nodes.
        """
        indices = target_node_indices.clone()
        if shuffle:
            indices = indices[torch.randperm(len(indices))]

        for start_idx in range(0, len(indices), batch_size):
            batch_seeds = indices[start_idx: start_idx + batch_size]
            yield self.sample_batch(batch_seeds, device=device)
