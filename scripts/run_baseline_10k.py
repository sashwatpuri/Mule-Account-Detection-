"""
End-to-end 10K Baseline Execution Script.
1. Samples 10,000 stratified accounts (maintaining ~2.79% class balance).
2. Processes transactions across batches via batch binning.
3. Assembles dataset with metadata, temporal dates, and behavioral AML features.
4. Trains and evaluates Decision Tree Baseline with 5-Fold Stratified Cross-Validation.
"""
import sys
import os

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.batch_sampler import build_10k_baseline_dataset
from src.models.decision_tree_baseline import train_decision_tree_baseline

def main():
    print("=" * 70)
    print("RBIH AML MULE DETECTION: 10K STRATIFIED BASELINE PIPELINE")
    print("=" * 70)

    # Step 1: Build 10K Baseline Dataset using transaction batch-binning
    print("\n[STEP 1/2] Building 10K baseline dataset with transaction batch binning...")
    build_10k_baseline_dataset(n_samples=10000)

    # Step 2: Train Decision Tree Baseline
    print("\n[STEP 2/2] Training Decision Tree Classifier with balanced weights...")
    train_decision_tree_baseline(data_path="outputs/train_10k_baseline.parquet")

    print("\n" + "=" * 70)
    print("10K Baseline Pipeline Completed Successfully!")
    print("=" * 70)

if __name__ == "__main__":
    main()
