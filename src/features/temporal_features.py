"""
Temporal Feature Engineering.
Integrates account opening, KYC, mobile update, freeze, and mule flag timestamps
into actionable time-difference features and window boundaries.
"""
import polars as pl

def extract_account_temporal_features(df):
    """
    Computes time differences from account dates.
    """
    # Reference anchor date (end of dataset period)
    anchor_date = pl.lit("2025-06-30").str.to_date("%Y-%m-%d")

    exprs = []

    # 1. Account age in days as of June 2025
    if "account_opening_date" in df.columns:
        exprs.append(
            pl.when(pl.col("account_opening_date").is_not_null())
            .then((anchor_date - pl.col("account_opening_date").str.to_date("%Y-%m-%d")).dt.total_days())
            .otherwise(None)
            .alias("account_age_days")
        )

    # 2. Relationship age in days
    if "relationship_start_date" in df.columns:
        exprs.append(
            pl.when(pl.col("relationship_start_date").is_not_null())
            .then((anchor_date - pl.col("relationship_start_date").str.to_date("%Y-%m-%d")).dt.total_days())
            .otherwise(None)
            .alias("relationship_age_days")
        )

    # 3. Days since last KYC
    if "last_kyc_date" in df.columns:
        exprs.append(
            pl.when(pl.col("last_kyc_date").is_not_null())
            .then((anchor_date - pl.col("last_kyc_date").str.to_date("%Y-%m-%d")).dt.total_days())
            .otherwise(None)
            .alias("days_since_last_kyc")
        )

    # 4. Mobile update recency and flag
    if "last_mobile_update_date" in df.columns:
        exprs.append(
            pl.col("last_mobile_update_date").is_not_null().cast(pl.Int32).alias("has_mobile_update")
        )
        exprs.append(
            pl.when(pl.col("last_mobile_update_date").is_not_null())
            .then((anchor_date - pl.col("last_mobile_update_date").str.to_date("%Y-%m-%d")).dt.total_days())
            .otherwise(-1)
            .alias("days_since_mobile_update")
        )

    # 5. Freeze duration in days (if frozen)
    if "freeze_date" in df.columns:
        exprs.append(
            pl.col("freeze_date").is_not_null().cast(pl.Int32).alias("is_frozen_flag")
        )
        exprs.append(
            pl.when(pl.col("freeze_date").is_not_null())
            .then((anchor_date - pl.col("freeze_date").str.to_date("%Y-%m-%d")).dt.total_days())
            .otherwise(-1)
            .alias("days_since_freeze")
        )

    # 6. Flag date relative to opening date (for labelled mules)
    if "mule_flag_date" in df.columns and "account_opening_date" in df.columns:
        exprs.append(
            pl.when(pl.col("mule_flag_date").is_not_null() & pl.col("account_opening_date").is_not_null())
            .then((pl.col("mule_flag_date").str.to_date("%Y-%m-%d") - pl.col("account_opening_date").str.to_date("%Y-%m-%d")).dt.total_days())
            .otherwise(-1)
            .alias("days_open_to_mule_flag")
        )

    return df.with_columns(exprs)
