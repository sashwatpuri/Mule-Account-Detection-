"""
Account and Customer metadata feature extraction.
Encodes categorical features and computes static account attributes.
"""
import polars as pl
import numpy as np

def extract_account_features(metadata_df):
    """
    Extracts tabular features from merged account metadata.
    """
    df = metadata_df.clone()

    # Binary flags (Y/N -> 1/0)
    flag_cols = [
        "nomination_flag", "cheque_allowed", "cheque_availed",
        "kyc_compliant", "rural_branch", "pan_available",
        "aadhaar_available", "passport_available", "mobile_banking_flag",
        "internet_banking_flag", "atm_card_flag", "demat_flag",
        "credit_card_flag", "fastag_flag", "joint_account_flag", "nri_flag"
    ]
    
    exprs = []
    for col in flag_cols:
        if col in df.columns:
            exprs.append(
                pl.when(pl.col(col) == "Y").then(1)
                .when(pl.col(col) == "N").then(0)
                .otherwise(0)
                .alias(col)
            )

    # Balance features
    numeric_cols = [
        "avg_balance", "monthly_avg_balance", "quarterly_avg_balance", "daily_avg_balance",
        "num_chequebooks", "loan_sum", "loan_count", "cc_sum", "cc_count",
        "od_sum", "od_count", "ka_sum", "ka_count", "sa_sum", "sa_count",
        "branch_employee_count", "branch_turnover", "branch_asset_size"
    ]
    for col in numeric_cols:
        if col in df.columns:
            exprs.append(pl.col(col).fill_null(0.0).alias(col))

    # Categorical string columns to frequency encoding or category indices
    cat_cols = ["product_code", "product_family", "scheme_code", "branch_type"]
    for col in cat_cols:
        if col in df.columns:
            exprs.append(pl.col(col).fill_null("UNKNOWN").alias(col))

    df = df.with_columns(exprs)
    return df
