"""
Stratified Sampling & Batch-Binning Transaction Processor.
Creates a stratified sample of 10,000 accounts (maintaining ~2.79% class balance)
and processes transaction partitions through batch binning to avoid memory exhaustion.
"""
import os
import time
from glob import glob
import polars as pl
from sklearn.model_selection import StratifiedShuffleSplit

from src.data.loader import load_account_metadata
from src.features.account_features import extract_account_features
from src.features.temporal_features import extract_account_temporal_features
from src.features.transaction_features import extract_transaction_features_for_partition

def get_stratified_sample_accounts(n_samples=10000, random_state=42):
    """
    Selects a stratified sample of accounts preserving the mule/non-mule ratio
    and distribution across account schemes.
    """
    print(f"Sampling {n_samples:,} stratified accounts...", flush=True)
    train_labels = pl.read_parquet("Dataset/train_labels.parquet")
    accounts_add = pl.read_parquet("Dataset/accounts-additional.parquet")

    merged = train_labels.join(accounts_add, on="account_id", how="left")
    
    # Create stratification stratum string
    stratum = (
        merged["is_mule"].cast(pl.String) + "_" + 
        merged["scheme_code"].fill_null("UNKNOWN")
    ).to_list()

    # Stratified split to pick n_samples
    sss = StratifiedShuffleSplit(n_splits=1, train_size=n_samples, random_state=random_state)
    sample_indices, _ = next(sss.split(merged["account_id"].to_numpy(), stratum))

    sampled_df = merged[sample_indices]
    
    mule_c = sampled_df.filter(pl.col("is_mule") == 1).shape[0]
    legit_c = sampled_df.filter(pl.col("is_mule") == 0).shape[0]
    print(f"Sampled {len(sampled_df):,} accounts: {mule_c} Mules ({mule_c/len(sampled_df)*100:.2f}%), {legit_c} Legit.", flush=True)
    
    return sampled_df

def process_transactions_with_batch_binning(target_account_ids, max_partitions=None):
    """
    Processes transaction partition files in batch bins, extracting features for target accounts.
    Uses ultra-fast Polars inner hash-join to filter partition rows.
    """
    print("\n--- Starting Batch-Binning Transaction Processing ---", flush=True)
    all_parts = sorted(glob("Dataset/transactions/batch-*/part_*.parquet"))
    if max_partitions:
        all_parts = all_parts[:max_partitions]

    total_parts = len(all_parts)
    print(f"Total transaction partitions to scan: {total_parts} across batches.", flush=True)

    target_df = pl.DataFrame({"account_id": target_account_ids})
    aggregated_dfs = []
    
    t0 = time.time()
    for i, part_path in enumerate(all_parts):
        # Quick read
        part_df = pl.read_parquet(part_path)
        
        # Fast inner join with target accounts
        sub_df = part_df.join(target_df, on="account_id", how="inner")
        if len(sub_df) > 0:
            agg_part = extract_transaction_features_for_partition(sub_df)
            if len(agg_part) > 0:
                aggregated_dfs.append(agg_part)

        if (i + 1) % 40 == 0 or (i + 1) == total_parts:
            elapsed = time.time() - t0
            print(f"Processed [{i+1:3d}/{total_parts}] partitions in {elapsed:5.1f}s. Aggregated chunks: {len(aggregated_dfs)}", flush=True)

    if not aggregated_dfs:
        raise ValueError("No matching transactions found for target accounts.")

    # Combine all chunk aggregations & deduplicate if an account appeared across parts
    all_aggs = pl.concat(aggregated_dfs)
    if all_aggs["account_id"].n_unique() < len(all_aggs):
        all_aggs = all_aggs.unique(subset=["account_id"], keep="first")

    print(f"Total accounts found in transactions: {all_aggs['account_id'].n_unique():,}", flush=True)
    return all_aggs

def build_10k_baseline_dataset(n_samples=10000, max_partitions=None):
    """
    Orchestrates sampling, metadata merging, batch-binning transaction extraction,
    and returns a unified baseline DataFrame.
    """
    os.makedirs("outputs", exist_ok=True)
    out_file = "outputs/train_10k_baseline.parquet"

    # 1. Stratified sample
    sampled_accounts = get_stratified_sample_accounts(n_samples=n_samples)
    target_ids = sampled_accounts["account_id"].to_list()

    # 2. Tabular metadata & temporal features (filtered early for 10k accounts)
    metadata = load_account_metadata()
    target_id_set = set(target_ids)
    sampled_meta = metadata.filter(pl.col("account_id").is_in(list(target_id_set)))
    sampled_meta = extract_account_features(sampled_meta)
    sampled_meta = extract_account_temporal_features(sampled_meta)

    # 3. Process transactions via batch binning
    txn_features = process_transactions_with_batch_binning(target_ids, max_partitions=max_partitions)

    # 4. Join metadata + transactions + labels
    train_labels = pl.read_parquet("Dataset/train_labels.parquet").select(["account_id", "is_mule", "mule_flag_date", "alert_reason"])
    
    baseline_df = sampled_meta.join(txn_features, on="account_id", how="left")
    baseline_df = baseline_df.join(train_labels, on="account_id", how="inner")

    # Fill transaction nulls for accounts with 0 transactions
    txn_num_cols = [c for c in txn_features.columns if c != "account_id" and baseline_df[c].dtype in [pl.Float64, pl.Int64, pl.Int32]]
    baseline_df = baseline_df.with_columns([
        pl.col(c).fill_null(0) for c in txn_num_cols
    ])

    print(f"\nBaseline 10k dataset assembled: {len(baseline_df):,} rows, {len(baseline_df.columns)} columns.", flush=True)
    baseline_df.write_parquet(out_file)
    print(f"Saved baseline dataset to: {out_file}", flush=True)
    return baseline_df
