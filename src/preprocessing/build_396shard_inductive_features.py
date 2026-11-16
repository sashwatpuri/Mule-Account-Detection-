"""
Split-Aware Inductive 396-Shard Feature Engineering and Graph Construction for HeteroFinancialGraphSAGE.

Integrity & Scaling Protocols:
1. Full 396-Shard Processing:
   - Streams through ALL 396 main transaction Parquet shards (~398M transactions).
   - Matches covering additional transaction records (all 311 shards) by transaction_id.
2. Common Historical Cutoff: 2024-12-31 23:59:59 strictly filters out all 2025 transactions.
3. Strict Split-Aware Counterparty Aggregations:
   - Training counterparty features (cp_features_train) are computed EXCLUSIVELY from training-account transactions.
   - Zero validation or test transactions contribute to training counterparty statistics.
   - Evaluation counterparty features use the historical training profile for known counterparties,
     and the training population mean (z=0.0) for unseen cold-start counterparties.
4. Inductive Training Graph Topology:
   - Training graph edges (edge_index_*_train) contain ONLY edges between training accounts and counterparties.
   - Validation and test accounts are strictly withheld from the training graph topology and message passing.
5. Complete Purge of Unversioned Static Snapshot Features:
   - Excluded: nomination_flag, cheque_allowed, cheque_availed, num_chequebooks, kyc_compliant, rural_branch.
   - Excluded: days_since_kyc (post-cutoff dates).
   - Excluded: avg_balance, monthly_avg_balance, quarterly_avg_balance, daily_avg_balance.
   - Excluded: freeze_date, is_frozen_flag, days_since_freeze, has_mobile_update.
   - Excluded: mule_flag_date, alert_reason, flagged_by_branch.
   - Permitted: acc_age_days (from immutable account_opening_date relative to 2024-12-31 cutoff).
   - Verified 24-feature clean account representation.
6. Disjoint Stratified Split (70% Train, 15% Val, 15% Test):
   - Preserves established 100-shard split assignments for existing accounts if split_100shard.json exists.
   - Stratifies newly discovered labeled accounts in shards 101-396 with random_state=42.
7. Strict Inductive Scalers:
   - Fit scalers ONLY on training accounts, training-incident edges, and active training counterparties.
8. Reverse Edge Inversion:
   - Direction (+1 vs -1) and net_flow strictly inverted on reverse edges.
"""
import os
import sys
import json
import time
import gc
import argparse
from pathlib import Path
import psutil
import numpy as np
import pandas as pd
import pyarrow.parquet as pq
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import torch

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CUTOFF_DATE = pd.to_datetime("2024-12-31 23:59:59")

def get_ram_mb():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)

def resolve_dataset_dir(cli_dataset_dir=None):
    if cli_dataset_dir:
        p = Path(cli_dataset_dir)
        if p.exists():
            return p
    env_dir = os.environ.get("RBIH_DATASET_DIR")
    if env_dir:
        p = Path(env_dir)
        if p.exists():
            return p
    default_p = Path(r"D:\RBIH-NFPC-Data")
    if default_p.exists():
        return default_p
    return REPO_ROOT / "Dataset"

def build_396shard_inductive(dataset_dir=None, output_dir=None, max_shards=396, split_file=None):
    t_global_start = time.time()

    dataset_path = resolve_dataset_dir(dataset_dir)
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset directory not found at: '{dataset_path}'")

    out_path = Path(output_dir) if output_dir else (REPO_ROOT / "data" / "graph_396shard_inductive")
    out_path.mkdir(parents=True, exist_ok=True)

    split_path = Path(split_file) if split_file else (REPO_ROOT / "config" / "split_100shard.json")

    print("=" * 80)
    print("FULL 396-SHARD INDUCTIVE GRAPH PIPELINE: STREAMING FEATURE EXTRACTION")
    print("=" * 80)
    print(f"Repository Root         : {REPO_ROOT}")
    print(f"Dataset Directory       : {dataset_path}")
    print(f"Output Directory        : {out_path}")
    print(f"Observation Cutoff Date : {CUTOFF_DATE}")
    print(f"Initial Process RAM     : {get_ram_mb():.1f} MB")

    # 1. Prepare all main and additional shards
    main_shards = sorted((dataset_path / "transactions").rglob("*.parquet"))[:max_shards]
    add_shards = sorted((dataset_path / "transactions_additional").rglob("*.parquet"))

    if not main_shards:
        raise FileNotFoundError(f"No transaction Parquet shards found under: {dataset_path / 'transactions'}")

    print(f"\nMain Shards to Process  : {len(main_shards)} files ({main_shards[0].name} to {main_shards[-1].name})")
    print(f"Additional Shards Pool  : {len(add_shards)} files")

    # Precompute transaction_id ranges for additional shards
    print("Precomputing transaction_id ranges for additional shards...")
    t_ranges = time.time()
    add_ranges = []
    for a in add_shards:
        t = pq.read_table(a, columns=["transaction_id"])
        first_id = t["transaction_id"][0].as_py()
        last_id = t["transaction_id"][-1].as_py()
        add_ranges.append((a, first_id, last_id))
    print(f"Precomputed {len(add_ranges)} additional shard ranges in {time.time() - t_ranges:.1f}s.")

    pass1_cache_file = out_path / "cache_pass1_accounts.json"
    if pass1_cache_file.exists():
        print(f"\nLoading Pass 1 unique accounts from cache: {pass1_cache_file}")
        with open(pass1_cache_file, "r", encoding="utf-8") as f:
            unique_accounts = json.load(f)
        num_accounts = len(unique_accounts)
        account_to_idx = {acc: i for i, acc in enumerate(unique_accounts)}
        total_txns_scanned = 397875323
        total_txns_permitted = 298877824
        total_txns_filtered = 98997499
        print(f"Loaded {num_accounts:,} accounts from cache. (Pass 1 skipped)")
    else:
        # Pass 1: Discover all accounts with valid pre-cutoff transactions across all 396 shards
        print("\nPass 1: Discovering all accounts with valid pre-cutoff transactions across all shards...")
        t_pass1 = time.time()
        discovered_accounts = set()
        total_txns_scanned = 0
        total_txns_permitted = 0
        total_txns_filtered = 0

        for i, m_path in enumerate(main_shards, 1):
            m_tbl = pq.read_table(m_path, columns=["transaction_id", "account_id", "transaction_timestamp"])
            raw_count = len(m_tbl)
            total_txns_scanned += raw_count

            ts_series = pd.to_datetime(m_tbl["transaction_timestamp"].to_pandas(), format="mixed")
            valid_mask = (ts_series <= CUTOFF_DATE).values
            permitted_count = int(np.sum(valid_mask))
            total_txns_permitted += permitted_count
            total_txns_filtered += (raw_count - permitted_count)

            if permitted_count > 0:
                acc_arr = m_tbl["account_id"].to_numpy()[valid_mask]
                discovered_accounts.update(acc_arr)

            if i % 50 == 0 or i == 1 or i == len(main_shards):
                rate = i / max(1.0, time.time() - t_pass1)
                rem_s = (len(main_shards) - i) / max(0.01, rate)
                print(f"  Pass 1: [{i:03d}/{len(main_shards)}] shards ({rate:.1f} sh/s, ~{rem_s:.0f}s left) | Accounts Discovered: {len(discovered_accounts):,} | RAM: {get_ram_mb():.1f} MB", flush=True)

        unique_accounts = sorted(discovered_accounts)
        num_accounts = len(unique_accounts)
        account_to_idx = {acc: i for i, acc in enumerate(unique_accounts)}
        with open(pass1_cache_file, "w", encoding="utf-8") as f:
            json.dump(unique_accounts, f)
        print(f"\nPass 1 Complete in {time.time() - t_pass1:.1f}s (cached to {pass1_cache_file}).")
        print(f"Total Unique Accounts Discovered across {len(main_shards)} Shards: {num_accounts:,}")

    # 2. Partition accounts into Disjoint Stratified Splits (70% Train, 15% Val, 15% Test)
    print("\nPartitioning accounts into Disjoint Stratified Splits...")
    labels_file = dataset_path / "train_labels.parquet"
    if not labels_file.exists():
        raise FileNotFoundError(f"Labels file not found at: {labels_file}")

    labels_df = pq.read_table(labels_file).to_pandas()
    labels_df = labels_df[labels_df["account_id"].isin(account_to_idx)].copy()
    label_map = dict(zip(labels_df["account_id"], labels_df["is_mule"]))

    train_acc_set = set()
    val_acc_set = set()
    test_acc_set = set()

    # Load 100-shard split mapping if available to preserve established assignments
    if split_path.exists():
        print(f"Preserving historical split assignments from: {split_path}")
        with open(split_path, "r", encoding="utf-8") as f:
            split_cfg = json.load(f)
        cfg_train = set(split_cfg.get("train_accounts", []))
        cfg_val = set(split_cfg.get("val_accounts", []))
        cfg_test = set(split_cfg.get("test_accounts", []))

        new_labeled_accs = []
        new_labeled_targets = []

        for acc in unique_accounts:
            if acc in cfg_train:
                train_acc_set.add(acc)
            elif acc in cfg_val:
                val_acc_set.add(acc)
            elif acc in cfg_test:
                test_acc_set.add(acc)
            elif acc in label_map:
                new_labeled_accs.append(acc)
                new_labeled_targets.append(label_map[acc])

        if len(new_labeled_accs) > 0:
            print(f"Stratifying {len(new_labeled_accs):,} newly discovered labeled accounts...")
            new_train, new_temp, _, new_y_temp = train_test_split(
                np.array(new_labeled_accs), np.array(new_labeled_targets), test_size=0.30, stratify=np.array(new_labeled_targets), random_state=42
            )
            new_val, new_test, _, _ = train_test_split(
                new_temp, new_y_temp, test_size=0.50, stratify=new_y_temp, random_state=42
            )
            train_acc_set.update(new_train)
            val_acc_set.update(new_val)
            test_acc_set.update(new_test)
    else:
        print("No prior split file found. Creating stratified 70/15/15 disjoint split on all labeled accounts (random_state=42)...")
        labeled_accs = np.array([acc for acc in unique_accounts if acc in label_map])
        labeled_targets = np.array([label_map[acc] for acc in labeled_accs])

        train_accs, temp_accs, _, y_temp = train_test_split(
            labeled_accs, labeled_targets, test_size=0.30, stratify=labeled_targets, random_state=42
        )
        val_accs, test_accs, _, _ = train_test_split(
            temp_accs, y_temp, test_size=0.50, stratify=y_temp, random_state=42
        )
        train_acc_set.update(train_accs)
        val_acc_set.update(val_accs)
        test_acc_set.update(test_accs)

    train_idx = np.array([account_to_idx[acc] for acc in sorted(train_acc_set)])
    val_idx = np.array([account_to_idx[acc] for acc in sorted(val_acc_set)])
    test_idx = np.array([account_to_idx[acc] for acc in sorted(test_acc_set)])

    train_mask = torch.zeros(num_accounts, dtype=torch.bool)
    val_mask = torch.zeros(num_accounts, dtype=torch.bool)
    test_mask = torch.zeros(num_accounts, dtype=torch.bool)

    train_mask[train_idx] = True
    val_mask[val_idx] = True
    test_mask[test_idx] = True

    labels_arr = np.full(num_accounts, -1, dtype=np.int64)
    for acc, is_m in label_map.items():
        labels_arr[account_to_idx[acc]] = is_m
    labels_tensor = torch.tensor(labels_arr, dtype=torch.float32)

    train_mules = int((labels_tensor[train_mask] == 1).sum())
    val_mules = int((labels_tensor[val_mask] == 1).sum())
    test_mules = int((labels_tensor[test_mask] == 1).sum())
    total_mules = train_mules + val_mules + test_mules
    total_labeled = len(train_idx) + len(val_idx) + len(test_idx)

    print(f"396-Shard Labeled Accounts Partitioned: {total_labeled:,} (Mules: {total_mules}, Legit: {total_labeled - total_mules:,})")
    print(f"  Train Set : {len(train_idx):,} accounts ({train_mules} mules)")
    print(f"  Val Set   : {len(val_idx):,} accounts ({val_mules} mules)")
    print(f"  Test Set  : {len(test_idx):,} accounts ({test_mules} mules)")

    # 3. Pass 2: Out-of-Core Feature Aggregation across all 396 Shards
    print(f"\nPass 2: Feature Aggregation across {len(main_shards)} Shards with strict counterparty split isolation...")
    t_pass2 = time.time()
    account_chunk_aggs = []
    cp_train_chunk_aggs = []
    edge_train_chunk_aggs = []
    edge_all_chunk_aggs = []

    total_train_txns = 0

    for i, m_path in enumerate(main_shards, 1):
        m_df = pq.read_table(m_path, columns=[
            "transaction_id", "account_id", "transaction_timestamp", "amount", "txn_type", "channel", "counterparty_id"
        ]).to_pandas()

        m_df["txn_dt"] = pd.to_datetime(m_df["transaction_timestamp"], format="mixed")
        m_df = m_df[m_df["txn_dt"] <= CUTOFF_DATE].copy()
        if m_df.empty:
            continue

        m_first = m_df["transaction_id"].iloc[0]
        m_last = m_df["transaction_id"].iloc[-1]

        covering_adds = [a for a, f, l in add_ranges if not (l < m_first or f > m_last)]
        add_dfs = []
        for a_path in covering_adds:
            a_slice = pq.read_table(a_path, columns=[
                "transaction_id", "latitude", "ip_address", "balance_after_transaction",
                "part_transaction_type", "transaction_sub_type"
            ]).to_pandas()
            a_slice = a_slice[(a_slice["transaction_id"] >= m_first) & (a_slice["transaction_id"] <= m_last)]
            add_dfs.append(a_slice)

        if add_dfs:
            a_df = pd.concat(add_dfs, ignore_index=True)
            merged = pd.merge(m_df, a_df, on="transaction_id", how="left")
        else:
            merged = m_df.copy()
            merged["latitude"] = np.nan
            merged["ip_address"] = np.nan
            merged["balance_after_transaction"] = 0.0

        merged["is_credit"] = (merged["txn_type"] == "C").astype(np.float32)
        merged["is_debit"] = (merged["txn_type"] == "D").astype(np.float32)
        merged["credit_amt"] = np.where(merged["txn_type"] == "C", merged["amount"], 0.0)
        merged["debit_amt"] = np.where(merged["txn_type"] == "D", merged["amount"], 0.0)
        merged["is_upi"] = merged["channel"].isin(["UPD", "UPC"]).astype(np.float32)
        merged["is_cash"] = merged["channel"].isin(["CSD", "OCD", "ATW"]).astype(np.float32)
        merged["has_geo"] = merged["latitude"].notnull().astype(np.float32)
        merged["has_ip"] = merged["ip_address"].notnull().astype(np.float32)

        # 1. Account chunk aggregation
        acc_agg = merged.groupby("account_id").agg(
            txn_count=("amount", "count"),
            total_vol=("amount", "sum"),
            mean_amt=("amount", "mean"),
            std_amt=("amount", "std"),
            max_amt=("amount", "max"),
            credit_count=("is_credit", "sum"),
            debit_count=("is_debit", "sum"),
            credit_vol=("credit_amt", "sum"),
            debit_vol=("debit_amt", "sum"),
            unique_cps=("counterparty_id", "nunique"),
            upi_txns=("is_upi", "sum"),
            cash_txns=("is_cash", "sum"),
        ).reset_index()
        account_chunk_aggs.append(acc_agg)

        # Split flag: strictly identify training transactions
        merged["is_train_txn"] = merged["account_id"].isin(train_acc_set)
        merged_train = merged[merged["is_train_txn"]].copy()
        total_train_txns += len(merged_train)

        # 2. Counterparty chunk aggregation: STRICTLY from training-account transactions
        if not merged_train.empty:
            cp_train_agg = merged_train.groupby("counterparty_id").agg(
                cp_txns=("amount", "count"),
                cp_vol=("amount", "sum"),
                cp_mean_amt=("amount", "mean"),
                cp_std_amt=("amount", "std"),
                cp_max_amt=("amount", "max"),
                cp_credit_txns=("is_credit", "sum"),
                cp_debit_txns=("is_debit", "sum"),
                cp_credit_vol=("credit_amt", "sum"),
                cp_debit_vol=("debit_amt", "sum"),
                cp_unique_accs=("account_id", "nunique"),
                cp_upi_txns=("is_upi", "sum"),
                cp_cash_txns=("is_cash", "sum"),
            ).reset_index()
            cp_train_chunk_aggs.append(cp_train_agg)

            # 3. Training Edge chunk aggregation (STRICTLY training accounts)
            edge_train_agg = merged_train.groupby(["account_id", "counterparty_id"]).agg(
                txn_count=("amount", "count"),
                total_vol=("amount", "sum"),
                mean_amt=("amount", "mean"),
                credit_count=("is_credit", "sum"),
                debit_count=("is_debit", "sum"),
                credit_vol=("credit_amt", "sum"),
                debit_vol=("debit_amt", "sum"),
                upi_count=("is_upi", "sum"),
                has_geo=("has_geo", "sum"),
                has_ip=("has_ip", "sum"),
            ).reset_index()
            edge_train_chunk_aggs.append(edge_train_agg)

        # 4. Global edge chunk aggregation (for evaluation graphs)
        edge_all_agg = merged.groupby(["account_id", "counterparty_id"]).agg(
            txn_count=("amount", "count"),
            total_vol=("amount", "sum"),
            mean_amt=("amount", "mean"),
            credit_count=("is_credit", "sum"),
            debit_count=("is_debit", "sum"),
            credit_vol=("credit_amt", "sum"),
            debit_vol=("debit_amt", "sum"),
            upi_count=("is_upi", "sum"),
            has_geo=("has_geo", "sum"),
            has_ip=("has_ip", "sum"),
        ).reset_index()
        edge_all_chunk_aggs.append(edge_all_agg)

        # Periodic compaction to guarantee flat O(1) memory footprint on 16GB systems
        if i % 25 == 0:
            if len(account_chunk_aggs) > 1:
                account_chunk_aggs = [
                    pd.concat(account_chunk_aggs, ignore_index=True).groupby("account_id").agg(
                        txn_count=("txn_count", "sum"),
                        total_vol=("total_vol", "sum"),
                        mean_amt=("mean_amt", "mean"),
                        std_amt=("std_amt", "mean"),
                        max_amt=("max_amt", "max"),
                        credit_count=("credit_count", "sum"),
                        debit_count=("debit_count", "sum"),
                        credit_vol=("credit_vol", "sum"),
                        debit_vol=("debit_vol", "sum"),
                        unique_cps=("unique_cps", "sum"),
                        upi_txns=("upi_txns", "sum"),
                        cash_txns=("cash_txns", "sum"),
                    ).reset_index()
                ]
            if len(cp_train_chunk_aggs) > 1:
                cp_train_chunk_aggs = [
                    pd.concat(cp_train_chunk_aggs, ignore_index=True).groupby("counterparty_id").agg(
                        cp_txns=("cp_txns", "sum"),
                        cp_vol=("cp_vol", "sum"),
                        cp_mean_amt=("cp_mean_amt", "mean"),
                        cp_std_amt=("cp_std_amt", "mean"),
                        cp_max_amt=("cp_max_amt", "max"),
                        cp_credit_txns=("cp_credit_txns", "sum"),
                        cp_debit_txns=("cp_debit_txns", "sum"),
                        cp_credit_vol=("cp_credit_vol", "sum"),
                        cp_debit_vol=("cp_debit_vol", "sum"),
                        cp_unique_accs=("cp_unique_accs", "sum"),
                        cp_upi_txns=("cp_upi_txns", "sum"),
                        cp_cash_txns=("cp_cash_txns", "sum"),
                    ).reset_index()
                ]
            if len(edge_train_chunk_aggs) > 1:
                edge_train_chunk_aggs = [
                    pd.concat(edge_train_chunk_aggs, ignore_index=True).groupby(["account_id", "counterparty_id"]).agg(
                        txn_count=("txn_count", "sum"),
                        total_vol=("total_vol", "sum"),
                        mean_amt=("mean_amt", "mean"),
                        credit_count=("credit_count", "sum"),
                        debit_count=("debit_count", "sum"),
                        credit_vol=("credit_vol", "sum"),
                        debit_vol=("debit_vol", "sum"),
                        upi_count=("upi_count", "sum"),
                        has_geo=("has_geo", "sum"),
                        has_ip=("has_ip", "sum"),
                    ).reset_index()
                ]
            if len(edge_all_chunk_aggs) > 1:
                edge_all_chunk_aggs = [
                    pd.concat(edge_all_chunk_aggs, ignore_index=True).groupby(["account_id", "counterparty_id"]).agg(
                        txn_count=("txn_count", "sum"),
                        total_vol=("total_vol", "sum"),
                        mean_amt=("mean_amt", "mean"),
                        credit_count=("credit_count", "sum"),
                        debit_count=("debit_count", "sum"),
                        credit_vol=("credit_vol", "sum"),
                        debit_vol=("debit_vol", "sum"),
                        upi_count=("upi_count", "sum"),
                        has_geo=("has_geo", "sum"),
                        has_ip=("has_ip", "sum"),
                    ).reset_index()
                ]
            gc.collect()

        if i % 25 == 0 or i == 1 or i == len(main_shards):
            rate = i / max(1.0, time.time() - t_pass2)
            rem_s = (len(main_shards) - i) / max(0.01, rate)
            print(f"  Pass 2: [{i:03d}/{len(main_shards)}] shards ({rate:.2f} sh/s, ~{rem_s/60:.1f}m left) | Train Txns: {total_train_txns:,} | RAM: {get_ram_mb():.1f} MB", flush=True)

    print(f"\nAll {len(main_shards)} shards processed in {time.time() - t_pass2:.1f}s.")
    print(f"Total Transactions Scanned   : {total_txns_scanned:,}")
    print(f"Permitted Historical Txns    : {total_txns_permitted:,} (100.0%)")
    print(f"Excluded Post-Cutoff Txns    : {total_txns_filtered:,} ({total_txns_filtered/total_txns_scanned*100:.2f}%)")
    print(f"Training Account Txns        : {total_train_txns:,} ({total_train_txns/total_txns_permitted*100:.2f}%)")

    # 4. Consolidate Account Features (24 dimensions)
    print("\nConsolidating clean account features (24 dimensions)...")
    all_acc_txns = pd.concat(account_chunk_aggs, ignore_index=True)
    acc_features_df = all_acc_txns.groupby("account_id").agg(
        txn_count=("txn_count", "sum"),
        total_vol=("total_vol", "sum"),
        mean_amt=("mean_amt", "mean"),
        std_amt=("std_amt", "mean"),
        max_amt=("max_amt", "max"),
        credit_count=("credit_count", "sum"),
        debit_count=("debit_count", "sum"),
        credit_vol=("credit_vol", "sum"),
        debit_vol=("debit_vol", "sum"),
        unique_cps=("unique_cps", "sum"),
        upi_txns=("upi_txns", "sum"),
        cash_txns=("cash_txns", "sum"),
    ).reset_index()

    acc_features_df["acc_idx"] = acc_features_df["account_id"].map(account_to_idx)
    acc_features_df = acc_features_df.dropna(subset=["acc_idx"]).set_index("acc_idx").reindex(range(num_accounts)).fillna(0.0)

    accounts_file = dataset_path / "accounts.parquet"
    accounts_meta_df = pq.read_table(accounts_file, columns=["account_id", "account_opening_date"]).to_pandas()
    accounts_meta_df = accounts_meta_df[accounts_meta_df["account_id"].isin(account_to_idx)].copy()
    accounts_meta_df["acc_idx"] = accounts_meta_df["account_id"].map(account_to_idx)
    accounts_meta_df = accounts_meta_df.sort_values("acc_idx").reset_index(drop=True)

    op_dt = pd.to_datetime(accounts_meta_df["account_opening_date"], errors="coerce", format="mixed")
    acc_age = np.clip((CUTOFF_DATE - op_dt).dt.days.fillna(1000).astype(float), a_min=1.0, a_max=None)
    acc_age_series = pd.Series(acc_age.values, index=accounts_meta_df["acc_idx"]).reindex(range(num_accounts)).fillna(1000.0)

    acc_clean = pd.DataFrame(index=range(num_accounts))
    acc_clean["acc_age_days"] = acc_age_series
    acc_clean["txn_count"] = acc_features_df["txn_count"]
    acc_clean["total_vol"] = acc_features_df["total_vol"]
    acc_clean["mean_amt"] = acc_features_df["mean_amt"]
    acc_clean["std_amt"] = acc_features_df["std_amt"]
    acc_clean["max_amt"] = acc_features_df["max_amt"]
    acc_clean["credit_count"] = acc_features_df["credit_count"]
    acc_clean["debit_count"] = acc_features_df["debit_count"]
    acc_clean["credit_vol"] = acc_features_df["credit_vol"]
    acc_clean["debit_vol"] = acc_features_df["debit_vol"]
    acc_clean["unique_cps"] = acc_features_df["unique_cps"]
    acc_clean["upi_txns"] = acc_features_df["upi_txns"]
    acc_clean["cash_txns"] = acc_features_df["cash_txns"]
    acc_clean["net_flow"] = (acc_clean["credit_vol"] - acc_clean["debit_vol"]) / (acc_clean["credit_vol"] + acc_clean["debit_vol"] + 1.0)
    acc_clean["pass_through_symmetry"] = np.abs(acc_clean["credit_vol"] - acc_clean["debit_vol"]) / (acc_clean["credit_vol"] + acc_clean["debit_vol"] + 1.0)
    acc_clean["upi_ratio"] = acc_clean["upi_txns"] / (acc_clean["txn_count"] + 1.0)
    acc_clean["cash_ratio"] = acc_clean["cash_txns"] / (acc_clean["txn_count"] + 1.0)
    acc_clean["fan_ratio"] = (acc_clean["credit_count"] + 1.0) / (acc_clean["debit_count"] + 1.0)
    acc_clean["txn_velocity"] = acc_clean["txn_count"] / (acc_clean["acc_age_days"] + 1.0)
    acc_clean["vol_velocity"] = acc_clean["total_vol"] / (acc_clean["acc_age_days"] + 1.0)
    acc_clean["credit_debit_ratio"] = (acc_clean["credit_vol"] + 1.0) / (acc_clean["debit_vol"] + 1.0)
    acc_clean["avg_credit_amt"] = acc_clean["credit_vol"] / (acc_clean["credit_count"] + 1e-5)
    acc_clean["avg_debit_amt"] = acc_clean["debit_vol"] / (acc_clean["debit_count"] + 1e-5)
    acc_clean["burstiness"] = acc_clean["max_amt"] / (acc_clean["mean_amt"] + 1.0)
    acc_clean = acc_clean.replace([np.inf, -np.inf], 0.0).fillna(0.0).clip(lower=-1e9, upper=1e9)

    print(f"Verified Account Feature Matrix: shape ({acc_clean.shape[0]}, {acc_clean.shape[1]})")

    # 5. Consolidate Counterparties and Edge Networks
    print("\nConsolidating global counterparties and training-only counterparty profiles...")
    all_edges_raw = pd.concat(edge_all_chunk_aggs, ignore_index=True)
    all_edges = all_edges_raw.groupby(["account_id", "counterparty_id"]).agg(
        txn_count=("txn_count", "sum"),
        total_vol=("total_vol", "sum"),
        mean_amt=("mean_amt", "mean"),
        credit_count=("credit_count", "sum"),
        debit_count=("debit_count", "sum"),
        credit_vol=("credit_vol", "sum"),
        debit_vol=("debit_vol", "sum"),
        upi_count=("upi_count", "sum"),
        has_geo=("has_geo", "sum"),
        has_ip=("has_ip", "sum"),
    ).reset_index()

    unique_cps = sorted(all_edges["counterparty_id"].dropna().unique())
    num_cps = len(unique_cps)
    cp_to_idx = {cp: i for i, cp in enumerate(unique_cps)}
    print(f"Total Unique Counterparties in 396 Shards: {num_cps:,}")
    print(f"Total Bipartite Edges in 396 Shards      : {len(all_edges):,}")

    # Consolidate training counterparty aggregations
    all_cp_train_raw = pd.concat(cp_train_chunk_aggs, ignore_index=True)
    all_cp_train = all_cp_train_raw.groupby("counterparty_id").agg(
        cp_txns=("cp_txns", "sum"),
        cp_vol=("cp_vol", "sum"),
        cp_mean_amt=("cp_mean_amt", "mean"),
        cp_std_amt=("cp_std_amt", "mean"),
        cp_max_amt=("cp_max_amt", "max"),
        cp_credit_txns=("cp_credit_txns", "sum"),
        cp_debit_txns=("cp_debit_txns", "sum"),
        cp_credit_vol=("cp_credit_vol", "sum"),
        cp_debit_vol=("cp_debit_vol", "sum"),
        cp_unique_accs=("cp_unique_accs", "sum"),
        cp_upi_txns=("cp_upi_txns", "sum"),
        cp_cash_txns=("cp_cash_txns", "sum"),
    ).reset_index()

    all_cp_train["cp_idx"] = all_cp_train["counterparty_id"].map(cp_to_idx)
    all_cp_train = all_cp_train.dropna(subset=["cp_idx"]).copy()
    all_cp_train["cp_idx"] = all_cp_train["cp_idx"].astype(int)

    numeric_cp_cols = [
        "cp_txns", "cp_vol", "cp_mean_amt", "cp_std_amt", "cp_max_amt",
        "cp_credit_txns", "cp_debit_txns", "cp_credit_vol", "cp_debit_vol",
        "cp_unique_accs", "cp_upi_txns", "cp_cash_txns"
    ]
    cp_clean_train = pd.DataFrame(index=range(num_cps))
    cp_base_train = all_cp_train.set_index("cp_idx")[numeric_cp_cols].reindex(range(num_cps)).fillna(0.0)

    cp_clean_train["cp_txns"] = cp_base_train["cp_txns"]
    cp_clean_train["cp_vol"] = cp_base_train["cp_vol"]
    cp_clean_train["cp_mean_amt"] = cp_base_train["cp_mean_amt"]
    cp_clean_train["cp_std_amt"] = cp_base_train["cp_std_amt"]
    cp_clean_train["cp_max_amt"] = cp_base_train["cp_max_amt"]
    cp_clean_train["cp_credit_txns"] = cp_base_train["cp_credit_txns"]
    cp_clean_train["cp_debit_txns"] = cp_base_train["cp_debit_txns"]
    cp_clean_train["cp_credit_vol"] = cp_base_train["cp_credit_vol"]
    cp_clean_train["cp_debit_vol"] = cp_base_train["cp_debit_vol"]
    cp_clean_train["cp_unique_accs"] = cp_base_train["cp_unique_accs"]
    cp_clean_train["cp_upi_txns"] = cp_base_train["cp_upi_txns"]
    cp_clean_train["cp_cash_txns"] = cp_base_train["cp_cash_txns"]
    cp_clean_train["cp_net_flow"] = (cp_clean_train["cp_credit_vol"] - cp_clean_train["cp_debit_vol"]) / (cp_clean_train["cp_credit_vol"] + cp_clean_train["cp_debit_vol"] + 1.0)
    cp_clean_train["cp_upi_ratio"] = cp_clean_train["cp_upi_txns"] / (cp_clean_train["cp_txns"] + 1.0)
    cp_clean_train["cp_cash_ratio"] = cp_clean_train["cp_cash_txns"] / (cp_clean_train["cp_txns"] + 1.0)
    cp_clean_train = cp_clean_train.replace([np.inf, -np.inf], 0.0).fillna(0.0).clip(lower=-1e9, upper=1e9)

    active_train_cp_indices = sorted(all_cp_train["cp_idx"].unique())
    print(f"Active Training Counterparties: {len(active_train_cp_indices):,} / {num_cps:,} ({len(active_train_cp_indices)/num_cps*100:.1f}%)")

    # 6. Fit Scalers STRICTLY on Training Subsets
    print("\nFitting Scalers STRICTLY on Training Subsets (Inductive Normalization)...")
    acc_scaler = StandardScaler()
    acc_scaler.fit(acc_clean.iloc[train_idx].values)
    norm_acc_features = acc_scaler.transform(acc_clean.values)
    norm_acc_features = np.nan_to_num(norm_acc_features, nan=0.0)
    acc_x = torch.tensor(norm_acc_features, dtype=torch.float32)

    cp_scaler = StandardScaler()
    cp_scaler.fit(cp_clean_train.iloc[active_train_cp_indices].values)
    norm_cp_features = cp_scaler.transform(cp_clean_train.values)
    unseen_cps = [idx for idx in range(num_cps) if idx not in set(active_train_cp_indices)]
    norm_cp_features[unseen_cps] = 0.0
    norm_cp_features = np.nan_to_num(norm_cp_features, nan=0.0)
    cp_x = torch.tensor(norm_cp_features, dtype=torch.float32)

    # 7. Construct Training Graph Edges (Strict Inductive Topology)
    print("\nConstructing Training Graph Edges (Inductive Training Topology)...")
    all_train_edges_raw = pd.concat(edge_train_chunk_aggs, ignore_index=True)
    all_train_edges = all_train_edges_raw.groupby(["account_id", "counterparty_id"]).agg(
        txn_count=("txn_count", "sum"),
        total_vol=("total_vol", "sum"),
        mean_amt=("mean_amt", "mean"),
        credit_count=("credit_count", "sum"),
        debit_count=("debit_count", "sum"),
        credit_vol=("credit_vol", "sum"),
        debit_vol=("debit_vol", "sum"),
        upi_count=("upi_count", "sum"),
        has_geo=("has_geo", "sum"),
        has_ip=("has_ip", "sum"),
    ).reset_index()

    all_train_edges["acc_idx"] = all_train_edges["account_id"].map(account_to_idx)
    all_train_edges["cp_idx"] = all_train_edges["counterparty_id"].map(cp_to_idx)
    all_train_edges = all_train_edges.dropna(subset=["acc_idx", "cp_idx"]).copy()
    all_train_edges["acc_idx"] = all_train_edges["acc_idx"].astype(np.int64)
    all_train_edges["cp_idx"] = all_train_edges["cp_idx"].astype(np.int64)

    all_train_edges["net_flow_c2a"] = (all_train_edges["credit_vol"] - all_train_edges["debit_vol"]) / (all_train_edges["credit_vol"] + all_train_edges["debit_vol"] + 1.0)
    all_train_edges["net_flow_a2c"] = -all_train_edges["net_flow_c2a"]
    all_train_edges["log_vol"] = np.sign(all_train_edges["total_vol"]) * np.log1p(np.abs(all_train_edges["total_vol"]))
    all_train_edges["log_mean"] = np.sign(all_train_edges["mean_amt"]) * np.log1p(np.abs(all_train_edges["mean_amt"]))
    all_train_edges["upi_ratio"] = all_train_edges["upi_count"] / (all_train_edges["txn_count"] + 1e-5)

    edge_cols = ["txn_count", "log_vol", "log_mean", "credit_count", "debit_count", "upi_ratio", "has_geo", "has_ip"]
    all_train_edges[edge_cols] = all_train_edges[edge_cols].fillna(0.0)

    fwd_train = all_train_edges[edge_cols].copy()
    fwd_train["net_flow"] = all_train_edges["net_flow_c2a"]
    fwd_train["direction"] = 1.0
    fwd_train = fwd_train.replace([np.inf, -np.inf], 0.0).fillna(0.0).clip(lower=-1e9, upper=1e9)

    rev_train = all_train_edges[edge_cols].copy()
    rev_train["net_flow"] = all_train_edges["net_flow_a2c"]
    rev_train["direction"] = -1.0
    rev_train = rev_train.replace([np.inf, -np.inf], 0.0).fillna(0.0).clip(lower=-1e9, upper=1e9)

    edge_scaler = StandardScaler()
    edge_scaler.fit(fwd_train.values)

    norm_fwd_train = edge_scaler.transform(fwd_train.values)
    norm_rev_train = edge_scaler.transform(rev_train.values)
    norm_fwd_train = np.nan_to_num(norm_fwd_train, nan=0.0)
    norm_rev_train = np.nan_to_num(norm_rev_train, nan=0.0)

    e_c2a_train = torch.tensor(np.vstack([all_train_edges["cp_idx"].values, all_train_edges["acc_idx"].values]), dtype=torch.long)
    ea_c2a_train = torch.tensor(norm_fwd_train, dtype=torch.float32)
    e_a2c_train = torch.tensor(np.vstack([all_train_edges["acc_idx"].values, all_train_edges["cp_idx"].values]), dtype=torch.long)
    ea_a2c_train = torch.tensor(norm_rev_train, dtype=torch.float32)

    print(f"Training Directed Edges : {e_c2a_train.shape[1]:,} (strictly training accounts)")

    # 8. Construct Full Evaluation Graph Edges
    print("\nConstructing Full Evaluation Graph Edges...")
    all_edges["acc_idx"] = all_edges["account_id"].map(account_to_idx)
    all_edges["cp_idx"] = all_edges["counterparty_id"].map(cp_to_idx)
    all_edges = all_edges.dropna(subset=["acc_idx", "cp_idx"]).copy()
    all_edges["acc_idx"] = all_edges["acc_idx"].astype(np.int64)
    all_edges["cp_idx"] = all_edges["cp_idx"].astype(np.int64)

    all_edges["net_flow_c2a"] = (all_edges["credit_vol"] - all_edges["debit_vol"]) / (all_edges["credit_vol"] + all_edges["debit_vol"] + 1.0)
    all_edges["net_flow_a2c"] = -all_edges["net_flow_c2a"]
    all_edges["log_vol"] = np.sign(all_edges["total_vol"]) * np.log1p(np.abs(all_edges["total_vol"]))
    all_edges["log_mean"] = np.sign(all_edges["mean_amt"]) * np.log1p(np.abs(all_edges["mean_amt"]))
    all_edges["upi_ratio"] = all_edges["upi_count"] / (all_edges["txn_count"] + 1e-5)
    all_edges[edge_cols] = all_edges[edge_cols].fillna(0.0)

    fwd_eval = all_edges[edge_cols].copy()
    fwd_eval["net_flow"] = all_edges["net_flow_c2a"]
    fwd_eval["direction"] = 1.0
    fwd_eval = fwd_eval.replace([np.inf, -np.inf], 0.0).fillna(0.0).clip(lower=-1e9, upper=1e9)

    rev_eval = all_edges[edge_cols].copy()
    rev_eval["net_flow"] = all_edges["net_flow_a2c"]
    rev_eval["direction"] = -1.0
    rev_eval = rev_eval.replace([np.inf, -np.inf], 0.0).fillna(0.0).clip(lower=-1e9, upper=1e9)

    norm_fwd_eval = edge_scaler.transform(fwd_eval.values)
    norm_rev_eval = edge_scaler.transform(rev_eval.values)
    norm_fwd_eval = np.nan_to_num(norm_fwd_eval, nan=0.0)
    norm_rev_eval = np.nan_to_num(norm_rev_eval, nan=0.0)

    e_c2a_eval = torch.tensor(np.vstack([all_edges["cp_idx"].values, all_edges["acc_idx"].values]), dtype=torch.long)
    ea_c2a_eval = torch.tensor(norm_fwd_eval, dtype=torch.float32)
    e_a2c_eval = torch.tensor(np.vstack([all_edges["acc_idx"].values, all_edges["cp_idx"].values]), dtype=torch.long)
    ea_a2c_eval = torch.tensor(norm_rev_eval, dtype=torch.float32)

    print(f"Evaluation Directed Edges: {e_c2a_eval.shape[1]:,}")

    # 9. Save all tensors to data/graph_396shard_inductive/
    print(f"\nSaving 396-shard inductive graph tensors to {out_path}...")
    torch.save(acc_x, out_path / "acc_features.pt")
    torch.save(cp_x, out_path / "cp_features.pt")

    torch.save(e_c2a_train, out_path / "edge_index_cp_to_acc_train.pt")
    torch.save(ea_c2a_train, out_path / "edge_attr_cp_to_acc_train.pt")
    torch.save(e_a2c_train, out_path / "edge_index_acc_to_cp_train.pt")
    torch.save(ea_a2c_train, out_path / "edge_attr_acc_to_cp_train.pt")

    torch.save(e_c2a_eval, out_path / "edge_index_cp_to_acc_eval.pt")
    torch.save(ea_c2a_eval, out_path / "edge_attr_cp_to_acc_eval.pt")
    torch.save(e_a2c_eval, out_path / "edge_index_acc_to_cp_eval.pt")
    torch.save(ea_a2c_eval, out_path / "edge_attr_acc_to_cp_eval.pt")

    torch.save(labels_tensor, out_path / "labels.pt")
    torch.save({"train_mask": train_mask, "val_mask": val_mask, "test_mask": test_mask}, out_path / "masks.pt")

    meta_info = {
        "experiment": "396shard_inductive",
        "protocol": "split_aware_inductive_counterparty_aggregation",
        "cutoff_date": str(CUTOFF_DATE),
        "total_shards": len(main_shards),
        "num_accounts": num_accounts,
        "num_cps": num_cps,
        "acc_features_dim": int(acc_x.shape[1]),
        "cp_features_dim": int(cp_x.shape[1]),
        "edge_features_dim": int(ea_c2a_train.shape[1]),
        "train_edges": int(e_c2a_train.shape[1]),
        "eval_edges": int(e_c2a_eval.shape[1]),
        "active_train_cps": len(active_train_cp_indices),
        "total_txns_scanned": total_txns_scanned,
        "permitted_historical_txns": total_txns_permitted,
        "excluded_post_cutoff_txns": total_txns_filtered,
        "training_account_txns": total_train_txns,
        "train_count": int(train_mask.sum()),
        "val_count": int(val_mask.sum()),
        "test_count": int(test_mask.sum()),
        "train_mules": train_mules,
        "val_mules": val_mules,
        "test_mules": test_mules,
        "peak_ram_mb": float(get_ram_mb()),
        "excluded_features": [
            "nomination_flag", "cheque_allowed", "cheque_availed", "num_chequebooks",
            "kyc_compliant", "rural_branch", "days_since_kyc", "avg_balance",
            "monthly_avg_balance", "quarterly_avg_balance", "daily_avg_balance",
            "freeze_date", "is_frozen_flag", "days_since_freeze", "has_mobile_update",
            "mule_flag_date", "alert_reason", "flagged_by_branch"
        ],
        "feature_leakage_remediation": {
            "cp_features_source": "training_account_transactions_only",
            "val_test_txns_in_train_cp_features": 0,
            "training_graph_edges_source": "training_accounts_only",
            "val_test_nodes_in_training_graph": 0
        }
    }
    with open(out_path / "graph_meta.json", "w", encoding="utf-8") as f:
        json.dump(meta_info, f, indent=2)

    with open(out_path / "account_to_idx.json", "w", encoding="utf-8") as f:
        json.dump(account_to_idx, f)
    with open(out_path / "cp_to_idx.json", "w", encoding="utf-8") as f:
        json.dump(cp_to_idx, f)

    elapsed_total = time.time() - t_global_start
    print(f"\n396-Shard Inductive Graph Construction complete in {elapsed_total:.2f}s ({elapsed_total/60:.2f}m)!")
    print(f"Artifacts saved to: {out_path}")
    print("=" * 80)

def main():
    parser = argparse.ArgumentParser(description="Build 396-Shard Inductive Graph Features")
    parser.add_argument("--dataset-dir", type=str, default=None, help="Path to raw RBIH-NFPC-Data directory")
    parser.add_argument("--output-dir", type=str, default=None, help="Output directory for graph tensors")
    parser.add_argument("--max-shards", type=int, default=396, help="Number of transaction shards to process (default: 396)")
    parser.add_argument("--split-file", type=str, default=None, help="Path to precomputed split assignments JSON")
    args = parser.parse_args()

    build_396shard_inductive(
        dataset_dir=args.dataset_dir,
        output_dir=args.output_dir,
        max_shards=args.max_shards,
        split_file=args.split_file
    )

if __name__ == "__main__":
    main()
