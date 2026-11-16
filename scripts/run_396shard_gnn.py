"""
End-to-End Orchestrator for Full 396-Shard Inductive GraphSAGE Pipeline.

Supports modular execution stages:
  1. preprocess : Extract 24 account, 15 counterparty, 10 edge features across all 396 shards and build inductive graph tensors.
  2. train      : Train HeteroFinancialGraphSAGE with mini-batch neighbor sampling on GPU/CPU.
  3. evaluate   : Perform validation threshold calibration and deterministic test evaluation.
  4. test       : Run the 5-point automated integrity, leakage, and reproducibility test suite.
  5. all        : Execute preprocess -> train -> evaluate -> test sequentially.

Usage:
  # Run entire pipeline using environment variable for dataset
  python scripts/run_396shard_gnn.py --stage all

  # Specify dataset path explicitly
  python scripts/run_396shard_gnn.py --stage preprocess --dataset-dir /path/to/RBIH-NFPC-Data

  # Train on preprocessed tensors
  python scripts/run_396shard_gnn.py --stage train

  # Evaluate existing pre-trained checkpoint on preprocessed tensors
  python scripts/run_396shard_gnn.py --stage evaluate
"""
import os
import sys
import argparse
from pathlib import Path

# Dynamically resolve repository root
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.preprocessing.build_396shard_inductive_features import build_396shard_inductive
from src.models.train_396shard_inductive import train_396shard_inductive
from src.models.evaluate_396shard_inductive import evaluate_396shard_inductive
from tests.test_396shard_inductive import run_all_tests

def main():
    parser = argparse.ArgumentParser(description="Run Full 396-Shard Inductive GraphSAGE Pipeline")
    parser.add_argument(
        "--stage",
        type=str,
        choices=["preprocess", "train", "evaluate", "test", "all"],
        default="all",
        help="Pipeline stage to execute (default: all)"
    )
    parser.add_argument("--dataset-dir", type=str, default=None, help="Directory containing raw RBIH-NFPC-Data")
    parser.add_argument("--graph-dir", type=str, default=None, help="Directory for preprocessed graph tensors (default: data/graph_396shard_inductive)")
    parser.add_argument("--checkpoint-dir", type=str, default=None, help="Directory for model checkpoints (default: checkpoints)")
    parser.add_argument("--report-dir", type=str, default=None, help="Directory for reports (default: reports)")
    parser.add_argument("--max-shards", type=int, default=396, help="Number of transaction shards to process (default: 396)")
    parser.add_argument("--epochs", type=int, default=80, help="Maximum training epochs (default: 80)")
    parser.add_argument("--batch-size", type=int, default=256, help="Mini-batch size (default: 256)")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate (default: 0.001)")
    args = parser.parse_args()

    graph_dir = Path(args.graph_dir) if args.graph_dir else (REPO_ROOT / "data" / "graph_396shard_inductive")
    ckpt_dir = Path(args.checkpoint_dir) if args.checkpoint_dir else (REPO_ROOT / "checkpoints")
    rpt_dir = Path(args.report_dir) if args.report_dir else (REPO_ROOT / "reports")
    ckpt_path = ckpt_dir / "best_graphsage_396shard_inductive.pt"

    print("=" * 80)
    print("RBIH AML MULE ACCOUNT DETECTION - FULL 396-SHARD INDUCTIVE GraphSAGE")
    print(f"Stage Selected: {args.stage.upper()}")
    print("=" * 80)

    # Stage 1: Preprocessing
    if args.stage in ["preprocess", "all"]:
        print("\n>>> STAGE 1: FEATURE EXTRACTION & INDUCTIVE GRAPH CONSTRUCTION (396 SHARDS)")
        build_396shard_inductive(
            dataset_dir=args.dataset_dir,
            output_dir=graph_dir,
            max_shards=args.max_shards
        )

    # Stage 2: Training
    if args.stage in ["train", "all"]:
        print("\n>>> STAGE 2: MINI-BATCH GraphSAGE GPU/CPU TRAINING (396 SHARDS)")
        train_396shard_inductive(
            graph_dir=graph_dir,
            checkpoint_dir=ckpt_dir,
            report_dir=rpt_dir,
            epochs=args.epochs,
            batch_size=args.batch_size,
            lr=args.lr
        )

    # Stage 3: Evaluation
    if args.stage in ["evaluate", "all"]:
        print("\n>>> STAGE 3: DETERMINISTIC TEST EVALUATION & THRESHOLD CALIBRATION (396 SHARDS)")
        evaluate_396shard_inductive(
            graph_dir=graph_dir,
            checkpoint_path=ckpt_path,
            report_dir=rpt_dir
        )

    # Stage 4: Testing
    if args.stage in ["test", "all"]:
        print("\n>>> STAGE 4: RUNNING AUTOMATED INTEGRITY & LEAKAGE VERIFICATION TESTS (396 SHARDS)")
        run_all_tests()

    print("\n" + "=" * 80)
    print("396-SHARD PIPELINE EXECUTION COMPLETED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    main()
