"""
Edge-Aware GraphSAGE Architecture for Heterogeneous Financial Transaction Graphs.

Architectural Notice:
Standard PyTorch Geometric `SAGEConv` does not natively consume edge attributes.
In financial fraud detection, transaction attributes (volume, direction, payment channel,
structuring flags) carry vital forensic signal.
This module implements `BipartiteEdgeAwareSAGEConv` (extending PyG's MessagePassing), which:
1. Projects edge attributes into the message latent space via an edge projection matrix.
2. Fuses neighbor node embeddings with projected edge embeddings:
       m_{j->i} = MLP_msg([x_j, W_e * e_{j,i}])
3. Computes neighborhood aggregation (mean / max pooling):
       a_i = AGG_{j in N(i)} (m_{j->i})
4. Executes the canonical GraphSAGE node update:
       h_i' = ReLU(W_update * [x_i, a_i] + b)
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import MessagePassing

class BipartiteEdgeAwareSAGEConv(MessagePassing):
    """
    Bipartite GraphSAGE operator with edge-conditioned message passing.
    """
    def __init__(self, in_channels_src: int, in_channels_dst: int, edge_channels: int, out_channels: int, aggr: str = "mean", dropout: float = 0.2):
        super().__init__(aggr=aggr)
        self.edge_proj = nn.Linear(edge_channels, in_channels_src)
        
        # Message MLP transforms [source_features || edge_features]
        self.msg_mlp = nn.Sequential(
            nn.Linear(in_channels_src * 2, out_channels),
            nn.ReLU(),
            nn.Dropout(p=dropout)
        )
        
        # SAGE update combines destination node state with aggregated neighborhood messages
        self.update_linear = nn.Linear(in_channels_dst + out_channels, out_channels)
        self.norm = nn.LayerNorm(out_channels)

    def forward(self, x, edge_index, edge_attr):
        """
        x: Tuple of (x_src, x_dst) where:
           x_src has shape [N_src, in_channels_src]
           x_dst has shape [N_dst, in_channels_dst]
        edge_index: [2, E] where edge_index[0] in [0, N_src) and edge_index[1] in [0, N_dst)
        edge_attr: [E, edge_channels]
        """
        x_src, x_dst = x
        out = self.propagate(edge_index, x=(x_src, x_dst), edge_attr=edge_attr, size=(x_src.size(0), x_dst.size(0)))
        return out

    def message(self, x_j, edge_attr):
        # x_j is source node feature indexed along edge_index[0]
        edge_emb = self.edge_proj(edge_attr)
        msg_input = torch.cat([x_j, edge_emb], dim=-1)
        return self.msg_mlp(msg_input)

    def update(self, aggr_out, x):
        # x[1] is destination node feature x_dst
        x_dst = x[1] if isinstance(x, tuple) else x
        concat = torch.cat([x_dst, aggr_out], dim=-1)
        updated = F.relu(self.update_linear(concat))
        return self.norm(updated)


class HeteroFinancialGraphSAGE(nn.Module):
    """
    2-Hop Heterogeneous GraphSAGE model for account-level mule detection.
    """
    def __init__(self, 
                 acc_in_dim: int, 
                 cp_in_dim: int, 
                 edge_dim: int, 
                 hidden_dim: int = 64, 
                 out_dim: int = 32,
                 dropout: float = 0.2):
        super().__init__()
        self.hidden_dim = hidden_dim
        
        # Initial node encoders
        self.acc_encoder = nn.Sequential(
            nn.Linear(acc_in_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout)
        )
        
        self.cp_encoder = nn.Sequential(
            nn.Linear(cp_in_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout)
        )

        # Hop 1 Message Passing:
        # Accounts -> Counterparties (Outflows)
        self.conv1_acc_to_cp = BipartiteEdgeAwareSAGEConv(
            in_channels_src=hidden_dim,
            in_channels_dst=hidden_dim,
            edge_channels=edge_dim,
            out_channels=hidden_dim,
            aggr="mean",
            dropout=dropout
        )

        # Counterparties -> Accounts (Inflows)
        self.conv1_cp_to_acc = BipartiteEdgeAwareSAGEConv(
            in_channels_src=hidden_dim,
            in_channels_dst=hidden_dim,
            edge_channels=edge_dim,
            out_channels=hidden_dim,
            aggr="mean",
            dropout=dropout
        )

        # Hop 2 Message Passing:
        # Counterparties -> Accounts (Aggregating 2-hop structural information into accounts)
        self.conv2_cp_to_acc = BipartiteEdgeAwareSAGEConv(
            in_channels_src=hidden_dim,
            in_channels_dst=hidden_dim,
            edge_channels=edge_dim,
            out_channels=out_dim,
            aggr="mean",
            dropout=dropout
        )

        # Mule Account Classification Head
        self.classifier = nn.Sequential(
            nn.Linear(out_dim, 32),
            nn.LayerNorm(32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1)  # Logit for binary classification
        )

    def forward(self, acc_x, cp_x, edge_index_cp_to_acc, edge_attr_cp_to_acc, edge_index_acc_to_cp, edge_attr_acc_to_cp):
        """
        Forward pass over the heterogeneous transaction graph.
        """
        # Step 0: Encode static & transactional node features
        h_acc_0 = self.acc_encoder(acc_x)
        h_cp_0 = self.cp_encoder(cp_x)

        # Step 1: Hop-1 Bipartite Message Passing
        # Update counterparties from connected accounts
        h_cp_1 = self.conv1_acc_to_cp(
            x=(h_acc_0, h_cp_0),
            edge_index=edge_index_acc_to_cp,
            edge_attr=edge_attr_acc_to_cp
        )

        # Update accounts from connected counterparties
        h_acc_1 = self.conv1_cp_to_acc(
            x=(h_cp_0, h_acc_0),
            edge_index=edge_index_cp_to_acc,
            edge_attr=edge_attr_cp_to_acc
        )

        # Residual connection
        h_acc_1 = h_acc_1 + h_acc_0
        h_cp_1 = h_cp_1 + h_cp_0

        # Step 2: Hop-2 Message Passing
        # Update accounts using 1-hop updated counterparties (capturing 2-hop network dynamics)
        h_acc_2 = self.conv2_cp_to_acc(
            x=(h_cp_1, h_acc_1),
            edge_index=edge_index_cp_to_acc,
            edge_attr=edge_attr_cp_to_acc
        )

        # Step 3: Account-level mule logit prediction
        logits = self.classifier(h_acc_2).squeeze(-1)
        return logits
