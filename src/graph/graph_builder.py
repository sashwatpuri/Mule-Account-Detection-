"""
Heterogeneous Financial Transaction Graph Builder using PyTorch Geometric HeteroData.
"""
from pathlib import Path
import json
import torch
from torch_geometric.data import HeteroData

def load_hetero_graph(graph_dir="data/graph"):
    """
    Constructs a PyTorch Geometric HeteroData object from preprocessed tensors.
    """
    d = Path(graph_dir)
    data = HeteroData()

    # Node features
    data["account"].x = torch.load(d / "acc_features.pt")
    data["counterparty"].x = torch.load(d / "cp_features.pt")

    # Labels and masks for account nodes
    data["account"].y = torch.load(d / "labels.pt")
    masks = torch.load(d / "masks.pt")
    data["account"].train_mask = masks["train_mask"]
    data["account"].val_mask = masks["val_mask"]
    data["account"].test_mask = masks["test_mask"]

    # Directed relationships with edge attributes
    # 1. Counterparty to Account (Credits / Inflow messages)
    data["counterparty", "transfers_to", "account"].edge_index = torch.load(d / "edge_index_cp_to_acc.pt")
    data["counterparty", "transfers_to", "account"].edge_attr = torch.load(d / "edge_attr_cp_to_acc.pt")

    # 2. Account to Counterparty (Debits / Outflow messages)
    data["account", "transfers_to", "counterparty"].edge_index = torch.load(d / "edge_index_acc_to_cp.pt")
    data["account", "transfers_to", "counterparty"].edge_attr = torch.load(d / "edge_attr_acc_to_cp.pt")

    # Load metadata
    with open(d / "graph_meta.json", "r", encoding="utf-8") as f:
        meta = json.load(f)
    data.meta = meta

    return data

if __name__ == "__main__":
    graph = load_hetero_graph()
    print("HeteroData Graph Loaded Successfully:")
    print(graph)
    print("Account feature dimension:", graph["account"].x.shape)
    print("Counterparty feature dimension:", graph["counterparty"].x.shape)
    print("CP -> Acc Edge Index shape:", graph["counterparty", "transfers_to", "account"].edge_index.shape)
