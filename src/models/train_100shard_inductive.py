"""
Mini-Batch GraphSAGE GPU Training on Split-Aware Inductive 100-Shard Financial Graph.
Uses:
- 24 clean, verified historical account features.
- Split-aware counterparty features (trained strictly on training-account transactions).
- Inductive training graph topology (training sampler strictly restricted to training-account incident edges).
- Accurate CUDA peak memory telemetry (torch.cuda.max_memory_allocated() and torch.cuda.memory_reserved()).
- Validation loss early stopping with checkpoint saved to checkpoints/best_graphsage_100shard_inductive.pt.
"""
import os
import sys
import json
import time
import argparse
from pathlib import Path

# Dynamically resolve repository root
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import roc_auc_score, average_precision_score

from src.models.edge_aware_sage import HeteroFinancialGraphSAGE
from src.graph.neighbor_sampler import BipartiteNeighborSampler

def set_seed(seed=42):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

def train_100shard_inductive(graph_dir=None, checkpoint_dir=None, report_dir=None,
                             epochs=80, batch_size=256, lr=1e-3, hidden_dim=64, 
                             out_dim=32, weight_decay=1e-4, patience=15):
    set_seed(42)

    g_dir = Path(graph_dir) if graph_dir else (REPO_ROOT / "data" / "graph_100shard_inductive")
    ckpt_dir = Path(checkpoint_dir) if checkpoint_dir else (REPO_ROOT / "checkpoints")
    rpt_dir = Path(report_dir) if report_dir else (REPO_ROOT / "reports")

    ckpt_dir.mkdir(parents=True, exist_ok=True)
    rpt_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 80)
    print("100-SHARD INDUCTIVE GraphSAGE TRAINING")
    print("=" * 80)
    print(f"Graph Tensors Directory : {g_dir}")
    print(f"Checkpoints Directory   : {ckpt_dir}")
    print(f"Reports Directory       : {rpt_dir}")

    if not (g_dir / "acc_features.pt").exists():
        raise FileNotFoundError(
            f"Graph tensors not found at: '{g_dir}'\n"
            "Please run the preprocessing step first:\n"
            "  python -m src.preprocessing.build_100shard_inductive_features\n"
            "or:\n"
            "  python scripts/run_100shard_gnn.py --stage preprocess"
        )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Active Compute Device   : {device}")
    if device.type == "cuda":
        print(f"GPU Hardware            : {torch.cuda.get_device_name(0)}")
        torch.cuda.reset_peak_memory_stats()

    # 1. Load Inductive Graph Tensors
    print("\nLoading 100-shard inductive graph tensors...")
    acc_x = torch.load(g_dir / "acc_features.pt")
    cp_x = torch.load(g_dir / "cp_features.pt")

    e_c2a_train = torch.load(g_dir / "edge_index_cp_to_acc_train.pt")
    ea_c2a_train = torch.load(g_dir / "edge_attr_cp_to_acc_train.pt")
    e_a2c_train = torch.load(g_dir / "edge_index_acc_to_cp_train.pt")
    ea_a2c_train = torch.load(g_dir / "edge_attr_acc_to_cp_train.pt")

    e_c2a_eval = torch.load(g_dir / "edge_index_cp_to_acc_eval.pt")
    ea_c2a_eval = torch.load(g_dir / "edge_attr_cp_to_acc_eval.pt")
    e_a2c_eval = torch.load(g_dir / "edge_index_acc_to_cp_eval.pt")
    ea_a2c_eval = torch.load(g_dir / "edge_attr_acc_to_cp_eval.pt")

    labels = torch.load(g_dir / "labels.pt")
    masks = torch.load(g_dir / "masks.pt")

    train_mask = masks["train_mask"]
    val_mask = masks["val_mask"]

    train_indices = torch.where(train_mask)[0]
    val_indices = torch.where(val_mask)[0]

    y_train = labels[train_mask]
    n_pos = (y_train == 1.0).sum().item()
    n_neg = (y_train == 0.0).sum().item()
    pos_weight = torch.tensor([n_neg / max(1.0, n_pos)], device=device)
    print(f"Train accounts: {len(train_indices):,} (Mules: {int(n_pos)}, Legit: {int(n_neg):,})")
    print(f"Calculated BCE pos_weight: {pos_weight.item():.2f}")

    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    # 2. Initialize Training Neighbor Sampler (Strictly Inductive Training Graph)
    print("\nInitializing Inductive Training Sampler (K1=15, K2=10 on training edges only)...")
    train_sampler = BipartiteNeighborSampler(
        acc_x=acc_x,
        cp_x=cp_x,
        edge_index_cp_to_acc=e_c2a_train,
        edge_attr_cp_to_acc=ea_c2a_train,
        edge_index_acc_to_cp=e_a2c_train,
        edge_attr_acc_to_cp=ea_a2c_train,
        labels=labels,
        sample_sizes=[15, 10]
    )

    # 3. Initialize Validation Neighbor Sampler (Evaluation Graph)
    print("Initializing Evaluation Sampler for Validation (K1=25, K2=15)...")
    val_sampler = BipartiteNeighborSampler(
        acc_x=acc_x,
        cp_x=cp_x,
        edge_index_cp_to_acc=e_c2a_eval,
        edge_attr_cp_to_acc=ea_c2a_eval,
        edge_index_acc_to_cp=e_a2c_eval,
        edge_attr_acc_to_cp=ea_a2c_eval,
        labels=labels,
        sample_sizes=[25, 15]
    )

    # 4. Instantiate Model Architecture
    acc_dim = acc_x.shape[1]
    cp_dim = cp_x.shape[1]
    edge_dim = ea_c2a_train.shape[1]

    model = HeteroFinancialGraphSAGE(
        acc_in_dim=acc_dim,
        cp_in_dim=cp_dim,
        edge_dim=edge_dim,
        hidden_dim=hidden_dim,
        out_dim=out_dim,
        dropout=0.25
    ).to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=5, min_lr=1e-5)

    print(f"\nInductive Model Architecture Initialized on {device}:")
    print(f"  Account In Dim       : {acc_dim} (Strictly verified point-in-time features)")
    print(f"  Counterparty In Dim  : {cp_dim} (Derived strictly from training transactions)")
    print(f"  Edge In Dim          : {edge_dim}")
    print(f"  Hidden Latent Dim    : {hidden_dim}")
    print(f"  Total Parameters     : {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")

    # 5. Training Loop
    best_val_loss = float("inf")
    best_val_prauc = 0.0
    best_val_roc = 0.0
    best_epoch = -1
    early_stop_counter = 0
    history = []

    print(f"\nStarting Mini-Batch Training (batch_size={batch_size}, ~{len(train_indices)//batch_size + 1} batches/epoch)...")
    t_train_start = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        epoch_loss = 0.0
        num_batches = 0
        all_train_preds = []
        all_train_targets = []

        for batch in train_sampler.get_dataloader(train_indices, batch_size=batch_size, shuffle=True, device=device):
            optimizer.zero_grad()

            logits = model(
                batch["sub_acc_x"],
                batch["sub_cp_x"],
                batch["sub_edge_index_cp_to_acc"],
                batch["sub_edge_attr_cp_to_acc"],
                batch["sub_edge_index_acc_to_cp"],
                batch["sub_edge_attr_acc_to_cp"]
            )

            seed_logits = logits[batch["seed_local_indices"]]
            loss = criterion(seed_logits, batch["seed_labels"])
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=2.0)
            optimizer.step()

            epoch_loss += loss.item()
            num_batches += 1
            all_train_preds.append(torch.sigmoid(seed_logits).detach().cpu().numpy())
            all_train_targets.append(batch["seed_labels"].cpu().numpy())

        avg_train_loss = epoch_loss / max(1, num_batches)
        y_train_arr = np.concatenate(all_train_targets)
        p_train_arr = np.concatenate(all_train_preds)
        train_roc = roc_auc_score(y_train_arr, p_train_arr) if len(np.unique(y_train_arr)) > 1 else 0.5
        train_prauc = average_precision_score(y_train_arr, p_train_arr) if len(np.unique(y_train_arr)) > 1 else 0.0

        # Mini-batch validation loop
        model.eval()
        val_losses = []
        all_val_preds = []
        all_val_targets = []
        with torch.no_grad():
            for v_batch in val_sampler.get_dataloader(val_indices, batch_size=256, shuffle=False, device=device):
                v_logits = model(
                    v_batch["sub_acc_x"],
                    v_batch["sub_cp_x"],
                    v_batch["sub_edge_index_cp_to_acc"],
                    v_batch["sub_edge_attr_cp_to_acc"],
                    v_batch["sub_edge_index_acc_to_cp"],
                    v_batch["sub_edge_attr_acc_to_cp"]
                )
                seed_v_logits = v_logits[v_batch["seed_local_indices"]]
                v_loss = criterion(seed_v_logits, v_batch["seed_labels"])
                val_losses.append(v_loss.item())
                all_val_preds.append(torch.sigmoid(seed_v_logits).cpu().numpy())
                all_val_targets.append(v_batch["seed_labels"].cpu().numpy())

        avg_val_loss = float(np.mean(val_losses))
        y_val_arr = np.concatenate(all_val_targets)
        p_val_arr = np.concatenate(all_val_preds)
        val_roc = float(roc_auc_score(y_val_arr, p_val_arr)) if len(np.unique(y_val_arr)) > 1 else 0.5
        val_prauc = float(average_precision_score(y_val_arr, p_val_arr)) if len(np.unique(y_val_arr)) > 1 else 0.0

        scheduler.step(avg_val_loss)

        peak_allocated_mb = torch.cuda.max_memory_allocated() / (1024**2) if device.type == "cuda" else 0.0
        peak_reserved_mb = torch.cuda.max_memory_reserved() / (1024**2) if device.type == "cuda" else 0.0

        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            best_val_prauc = val_prauc
            best_val_roc = val_roc
            best_epoch = epoch
            early_stop_counter = 0
            checkpoint = {
                "epoch": epoch,
                "model_state": model.state_dict(),
                "optimizer_state": optimizer.state_dict(),
                "best_val_loss": best_val_loss,
                "val_prauc": val_prauc,
                "val_roc": val_roc,
                "model_config": {
                    "acc_in_dim": acc_dim,
                    "cp_in_dim": cp_dim,
                    "edge_dim": edge_dim,
                    "hidden_dim": hidden_dim,
                    "out_dim": out_dim
                },
                "peak_gpu_allocated_mb": peak_allocated_mb,
                "peak_gpu_reserved_mb": peak_reserved_mb
            }
            torch.save(checkpoint, ckpt_dir / "best_graphsage_100shard_inductive.pt")
        else:
            early_stop_counter += 1

        history.append({
            "epoch": epoch,
            "train_loss": float(avg_train_loss),
            "val_loss": float(avg_val_loss),
            "train_roc": float(train_roc),
            "train_prauc": float(train_prauc),
            "val_roc": float(val_roc),
            "val_prauc": float(val_prauc),
            "peak_allocated_mb": float(peak_allocated_mb),
            "peak_reserved_mb": float(peak_reserved_mb)
        })

        if epoch % 5 == 0 or epoch == 1 or avg_val_loss == best_val_loss:
            print(f"Epoch {epoch:03d} | Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f} (Best: {best_val_loss:.4f} @ Ep {best_epoch}) | Val ROC: {val_roc:.4f} | Val PR-AUC: {val_prauc:.4f} | Peak VRAM: {peak_allocated_mb:.1f} MB (Res: {peak_reserved_mb:.1f} MB)")

        if early_stop_counter >= patience:
            print(f"\nEarly stopping triggered after {patience} epochs without validation loss improvement.")
            break

    elapsed = time.time() - t_train_start
    print(f"\n100-Shard Inductive Training completed in {elapsed:.2f}s ({elapsed/max(1, epoch):.2f}s/epoch).")
    print(f"Best Model Checkpoint saved at Epoch {best_epoch} (Val Loss: {best_val_loss:.4f}, Val PR-AUC: {best_val_prauc:.4f}) to:")
    print(f"  {ckpt_dir / 'best_graphsage_100shard_inductive.pt'}")

    with open(rpt_dir / "100shard_inductive_training_history.json", "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    return best_epoch, best_val_loss

def main():
    parser = argparse.ArgumentParser(description="Train 100-Shard Inductive GraphSAGE")
    parser.add_argument("--graph-dir", type=str, default=None, help="Directory containing preprocessed graph tensors")
    parser.add_argument("--checkpoint-dir", type=str, default=None, help="Directory to save model checkpoints")
    parser.add_argument("--report-dir", type=str, default=None, help="Directory to save training history JSON")
    parser.add_argument("--epochs", type=int, default=80, help="Maximum training epochs (default: 80)")
    parser.add_argument("--batch-size", type=int, default=256, help="Mini-batch size (default: 256)")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate (default: 0.001)")
    parser.add_argument("--hidden-dim", type=int, default=64, help="Hidden dimension (default: 64)")
    parser.add_argument("--patience", type=int, default=15, help="Early stopping patience (default: 15)")
    args = parser.parse_args()

    train_100shard_inductive(
        graph_dir=args.graph_dir,
        checkpoint_dir=args.checkpoint_dir,
        report_dir=args.report_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        hidden_dim=args.hidden_dim,
        patience=args.patience
    )

if __name__ == "__main__":
    main()
