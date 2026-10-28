"""
Full Dataset Feature Extractor.
Scales batch-binning feature extraction across all 396 transaction partition files (~400M transactions)
and generates full feature matrices for both Train (96,091 accounts) and Test (64,062 accounts).
"""
import os
import time
from glob import glob
import polars as pl

from src.data.loader import load_account_metadata
from src.features.account_features import extract_account_features
from src.features.temporal_features import extract_account_temporal_features
from src.features.transaction_features import extract_transaction_features_for_partition

def run_full_extraction():
    print("=" * 70, flush=True)
    print("SCALING FEATURE EXTRACTION ACROSS ENTIRE DATASET (160,153 ACCOUNTS)", flush=True)
    print("=" * 70, flush=True)

    os.makedirs("outputs", exist_ok=True)
    train_out = "outputs/train_features_full.parquet"
    test_out = "outputs/test_features_full.parquet"

    # Step 1: Process all 396 transaction partition files
    all_parts = sorted(glob("Dataset/transactions/batch-*/part_*.parquet"))
    total_parts = len(all_parts)
    print(f"\n[1/3] Scanning {total_parts} transaction partition files (~400,000,000 transactions)...", flush=True)

    aggregated_chunks = []
    t0 = time.time()
    
    for i, part_path in enumerate(all_parts):
        part_df = pl.read_parquet(part_path)
        agg_part = extract_transaction_features_for_partition(part_df)
        if len(agg_part) > 0:
            aggregated_chunks.append(agg_part)

        if (i + 1) % 40 == 0 or (i + 1) == total_parts:
            elapsed = time.time() - t0
            rate = (i + 1) / max(1.0, elapsed)
            remaining_s = (total_parts - (i + 1)) / max(0.01, rate)
            print(f"  Processed [{i+1:3d}/{total_parts}] partitions in {elapsed:5.1f}s ({rate:4.1f} parts/s, ~{remaining_s:.0f}s remaining).", flush=True)

    print(f"\nTransaction scan complete in {time.time()-t0:.1f}s. Concatenating {len(aggregated_chunks)} chunks...", flush=True)
    all_txns_df = pl.concat(aggregated_chunks)

    # Deduplicate if an account appeared across partition boundaries
    if all_txns_df["account_id"].n_unique() < len(all_txns_df):
        print(f"Deduplicating {len(all_txns_df):,} rows to {all_txns_df['account_id'].n_unique():,} unique accounts...", flush=True)
        all_txns_df = all_txns_df.unique(subset=["account_id"], keep="first")

    print(f"Extracted transaction behavioral features for {len(all_txns_df):,} accounts.", flush=True)

    # Step 2: Load and process metadata + temporal features
    print("\n[2/3] Merging metadata and temporal dates...", flush=True)
    metadata = load_account_metadata()
    metadata = extract_account_features(metadata)
    metadata = extract_account_temporal_features(metadata)

    # Merge metadata with transaction features
    full_merged = metadata.join(all_txns_df, on="account_id", how="left")

    # Fill numerical transaction nulls for any accounts with 0 transactions
    txn_cols = [c for c in all_txns_df.columns if c not in ["account_id", "first_txn_timestamp", "last_txn_timestamp", "suspicious_start", "suspicious_end"]]
    full_merged = full_merged.with_columns([
        pl.col(c).fill_null(0) for c in txn_cols
    ])

    print(f"Full feature matrix created: {len(full_merged):,} rows, {len(full_merged.columns)} columns.", flush=True)

    # Step 3: Partition into Train and Test matrices
    print("\n[3/3] Partitioning into Train (96,091) and Test (64,062) sets...", flush=True)
    train_labels = pl.read_parquet("Dataset/train_labels.parquet")
    test_accounts = pl.read_parquet("Dataset/test_accounts.parquet")

    # Train dataset (join with labels)
    train_full = train_labels.join(full_merged, on="account_id", how="inner")
    print(f"Train matrix: {len(train_full):,} rows, {len(train_full.columns)} columns. Mules: {train_full.filter(pl.col('is_mule')==1).shape[0]:,}")
    train_full.write_parquet(train_out)
    print(f"Saved Train features to: {train_out}", flush=True)

    # Test dataset (join with test accounts)
    test_full = test_accounts.join(full_merged, on="account_id", how="inner")
    print(f"Test matrix: {len(test_full):,} rows, {len(test_full.columns)} columns.")
    test_full.write_parquet(test_out)
    print(f"Saved Test features to: {test_out}", flush=True)

    print("\n" + "=" * 70, flush=True)
    print("FULL FEATURE EXTRACTION COMPLETED SUCCESSFULLY!", flush=True)
    print("=" * 70, flush=True)

if __name__ == "__main__":
    run_full_extraction()
