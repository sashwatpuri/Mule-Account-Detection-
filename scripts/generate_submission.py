"""
Submission Generator for AML Mule Account Detection.
Trains the class-weighted Decision Tree model on all 96,091 training accounts,
predicts on 64,062 test accounts, assigns suspicious window timestamps to predicted mules,
and formats the submission strictly to the competition specifications.
"""
import os
import sys
import json
import polars as pl
import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import OrdinalEncoder

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def generate_submission(train_path="outputs/train_features_full.parquet",
                        test_path="outputs/test_features_full.parquet",
                        output_path="submissions/baseline_decision_tree_submission.csv",
                        decision_threshold=0.5):
    print("=" * 70, flush=True)
    print("GENERATING AML MULE DETECTION SUBMISSION", flush=True)
    print("=" * 70, flush=True)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # 1. Load Train & Test Feature Matrices
    print("Loading feature matrices...", flush=True)
    train_df = pl.read_parquet(train_path)
    test_df = pl.read_parquet(test_path)
    print(f"Train accounts: {len(train_df):,}, Test accounts: {len(test_df):,}", flush=True)

    y_train = train_df["is_mule"].to_numpy()

    # 2. Select feature columns
    ignore_cols = {
        "account_id", "customer_id", "is_mule", "mule_flag_date", "alert_reason",
        "flagged_by_branch", "name", "address", "phone_number", "branch_address", "branch_city",
        "first_txn_timestamp", "last_txn_timestamp", "suspicious_start", "suspicious_end",
        "account_opening_date", "relationship_start_date", "last_kyc_date", "last_mobile_update_date",
        "freeze_date", "unfreeze_date", "address_last_update_date", "passbook_last_update_date",
        "customer_pin", "permanent_pin", "branch_pin", "branch_pin_code"
    }

    feature_cols = [c for c in train_df.columns if c not in ignore_cols and c in test_df.columns]
    print(f"Using {len(feature_cols)} clean behavioral & temporal features.", flush=True)

    # Convert to pandas for sklearn
    train_p = train_df.select(feature_cols).to_pandas()
    test_p = test_df.select(feature_cols).to_pandas()

    cat_cols = train_p.select_dtypes(include=["object", "string", "category"]).columns.tolist()
    if cat_cols:
        encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
        train_p[cat_cols] = encoder.fit_transform(train_p[cat_cols].astype(str))
        test_p[cat_cols] = encoder.transform(test_p[cat_cols].astype(str))

    train_p = train_p.fillna(-1.0)
    test_p = test_p.fillna(-1.0)

    X_train = train_p.values
    X_test = test_p.values

    # 3. Train Decision Tree Model
    print("Fitting class-weighted Decision Tree on full 96,091 accounts...", flush=True)
    clf = DecisionTreeClassifier(
        max_depth=6,
        min_samples_leaf=20,
        class_weight="balanced",
        random_state=42
    )
    clf.fit(X_train, y_train)

    # 4. Predict probabilities on test accounts
    print("Generating predictions for 64,062 test accounts...", flush=True)
    test_probs = clf.predict_proba(X_test)[:, 1]

    # 5. Build submission dataframe
    sub_df = pl.DataFrame({
        "account_id": test_df["account_id"],
        "is_mule": np.round(test_probs, 4),
        "suspicious_start_cand": test_df["suspicious_start"],
        "suspicious_end_cand": test_df["suspicious_end"]
    })

    # Apply threshold for suspicious timestamps
    # If is_mule >= decision_threshold, output candidate burst timestamps, else empty string
    sub_df = sub_df.with_columns([
        pl.when(pl.col("is_mule") >= decision_threshold)
        .then(pl.col("suspicious_start_cand").fill_null(""))
        .otherwise(pl.lit(""))
        .alias("suspicious_start"),

        pl.when(pl.col("is_mule") >= decision_threshold)
        .then(pl.col("suspicious_end_cand").fill_null(""))
        .otherwise(pl.lit(""))
        .alias("suspicious_end")
    ]).select(["account_id", "is_mule", "suspicious_start", "suspicious_end"])

    # 6. Verify and Save
    sub_df.write_csv(output_path)
    print(f"\nSubmission successfully saved to: {output_path}", flush=True)

    # Diagnostics
    flagged_test_mules = sub_df.filter(pl.col("is_mule") >= decision_threshold).shape[0]
    print(f"Summary Statistics:")
    print(f"  Total test rows:        {len(sub_df):,}")
    print(f"  Predicted mules (>= {decision_threshold}): {flagged_test_mules:,} ({flagged_test_mules/len(sub_df)*100:.2f}%)")
    print(f"  Predicted legitimate:   {len(sub_df)-flagged_test_mules:,}")
    print(f"  Mean mule probability:  {sub_df['is_mule'].mean():.4f}")
    print(f"\nFirst 5 rows of submission:")
    print(sub_df.head(5))

    return output_path

if __name__ == "__main__":
    generate_submission()
