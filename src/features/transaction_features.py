"""
Transaction Feature Extractor.
Extracts 13 behavioral AML money laundering features per account from transaction partitions.
Identifies peak suspicious activity window [suspicious_start, suspicious_end] for Temporal IoU.
"""
import polars as pl

def extract_transaction_features_for_partition(txn_df, target_account_ids=None):
    """
    Aggregates transaction behavior per account for a given partition of transactions.
    Computes base counts, volumes, structuring, counterparties, channels, and peak burst window.
    """
    df = txn_df
    if target_account_ids is not None:
        df = df.filter(pl.col("account_id").is_in(list(target_account_ids)))
    
    if len(df) == 0:
        return pl.DataFrame({"account_id": []})

    # 1. Base aggregations per account
    agg_exprs = [
        # Counts & volumes
        pl.len().alias("total_txns"),
        pl.col("amount").sum().alias("total_volume"),
        pl.col("amount").mean().alias("mean_amount"),
        pl.col("amount").median().alias("median_amount"),
        pl.col("amount").std().fill_null(0.0).alias("std_amount"),
        pl.col("amount").max().alias("max_amount"),
        pl.col("amount").min().alias("min_amount"),

        # Credit vs Debit
        (pl.col("txn_type") == "C").sum().alias("credit_count"),
        (pl.col("txn_type") == "D").sum().alias("debit_count"),
        pl.col("amount").filter(pl.col("txn_type") == "C").sum().fill_null(0.0).alias("credit_volume"),
        pl.col("amount").filter(pl.col("txn_type") == "D").sum().fill_null(0.0).alias("debit_volume"),

        # Structuring near 50,000 threshold (₹45,000 - ₹49,999)
        ((pl.col("amount") >= 45000) & (pl.col("amount") < 50000)).sum().alias("structuring_50k_count"),
        pl.col("amount").filter((pl.col("amount") >= 45000) & (pl.col("amount") < 50000)).sum().fill_null(0.0).alias("structuring_50k_vol"),
        ((pl.col("amount") >= 90000) & (pl.col("amount") < 100000)).sum().alias("structuring_100k_count"),

        # Round amounts
        ((pl.col("amount") % 1000 == 0) & (pl.col("amount") > 0)).sum().alias("round_1k_count"),
        ((pl.col("amount") % 5000 == 0) & (pl.col("amount") > 0)).sum().alias("round_5k_count"),
        ((pl.col("amount") % 10000 == 0) & (pl.col("amount") > 0)).sum().alias("round_10k_count"),
        ((pl.col("amount") % 50000 == 0) & (pl.col("amount") > 0)).sum().alias("round_50k_count"),

        # Counterparties (Fan-In / Fan-Out)
        pl.col("counterparty_id").filter(pl.col("txn_type") == "C").n_unique().alias("unique_credit_cp"),
        pl.col("counterparty_id").filter(pl.col("txn_type") == "D").n_unique().alias("unique_debit_cp"),
        pl.col("counterparty_id").n_unique().alias("total_unique_cp"),

        # Channels
        (pl.col("channel").is_in(["UPC", "UPD"])).sum().alias("upi_count"),
        (pl.col("channel") == "IPM").sum().alias("imps_count"),
        (pl.col("channel") == "NTD").sum().alias("neft_count"),
        (pl.col("channel").is_in(["CSD", "OCD"])).sum().alias("cash_deposit_count"),
        (pl.col("channel") == "ATW").sum().alias("atm_withdrawal_count"),
        (pl.col("channel") == "CHQ").sum().alias("cheque_count"),

        # Timestamps
        pl.col("transaction_timestamp").min().alias("first_txn_timestamp"),
        pl.col("transaction_timestamp").max().alias("last_txn_timestamp"),
    ]

    base = df.group_by("account_id").agg(agg_exprs)

    # 2. Monthly burst detection (identifies highest activity month for suspicious window)
    monthly = df.with_columns([
        pl.col("transaction_timestamp").str.slice(0, 7).alias("yr_mo"),
        ((pl.col("amount") >= 45000) & (pl.col("amount") < 50000)).cast(pl.Float64).alias("is_str")
    ]).group_by(["account_id", "yr_mo"]).agg([
        (pl.col("amount").sum() + pl.col("is_str").sum() * 50000.0).alias("burst_score"),
        pl.col("amount").sum().alias("peak_month_volume"),
        pl.len().alias("peak_month_txns"),
        pl.col("transaction_timestamp").min().alias("suspicious_start"),
        pl.col("transaction_timestamp").max().alias("suspicious_end")
    ])

    peak = (
        monthly.sort("burst_score", descending=True)
        .group_by("account_id")
        .first()
        .drop(["burst_score", "yr_mo"])
    )

    combined = base.join(peak, on="account_id", how="left")

    # Standardize timestamp string format
    ts_clean = combined.with_columns([
        pl.col("first_txn_timestamp").str.replace(" ", "T").str.slice(0, 19).str.to_datetime("%Y-%m-%dT%H:%M:%S", strict=False).alias("first_dt"),
        pl.col("last_txn_timestamp").str.replace(" ", "T").str.slice(0, 19).str.to_datetime("%Y-%m-%dT%H:%M:%S", strict=False).alias("last_dt"),
    ])

    # Derived ratios
    derived = ts_clean.with_columns([
        # Pass-through balance symmetry: abs(C - D) / (C + D + 1)
        (
            (pl.col("credit_volume") - pl.col("debit_volume")).abs() / 
            (pl.col("credit_volume") + pl.col("debit_volume") + 1.0)
        ).alias("pass_through_symmetry"),

        # Structuring ratio
        (pl.col("structuring_50k_count") / (pl.col("total_txns") + 1.0)).alias("structuring_50k_ratio"),

        # Round ratio
        (pl.col("round_5k_count") / (pl.col("total_txns") + 1.0)).alias("round_5k_ratio"),

        # Fan-in / Fan-out ratio
        (
            (pl.col("unique_credit_cp") + 1.0) / 
            (pl.col("unique_debit_cp") + 1.0)
        ).alias("fan_in_out_ratio"),

        # UPI dominance ratio
        (pl.col("upi_count") / (pl.col("total_txns") + 1.0)).alias("upi_ratio"),

        # Peak month concentration ratio
        (pl.col("peak_month_volume") / (pl.col("total_volume") + 1.0)).alias("peak_month_vol_ratio"),

        # Active days between first and last txn
        (
            (pl.col("last_dt") - pl.col("first_dt")).dt.total_days()
        ).fill_null(0).alias("active_lifespan_days"),
    ]).drop(["first_dt", "last_dt"])

    return derived
