"""
Automated test suite validating the submission CSV file against competition guidelines.
"""
import polars as pl

def test_submission_schema_and_integrity():
    sub_path = "submissions/baseline_decision_tree_submission.csv"
    test_ref_path = "Dataset/test_accounts.parquet"

    sub = pl.read_csv(sub_path)
    test_ref = pl.read_parquet(test_ref_path)

    # 1. Exact row count
    assert len(sub) == len(test_ref), f"Expected {len(test_ref)} rows, got {len(sub)}"
    assert len(sub) == 64062

    # 2. Required columns
    expected_cols = ["account_id", "is_mule", "suspicious_start", "suspicious_end"]
    assert sub.columns == expected_cols, f"Columns mismatch: {sub.columns} vs {expected_cols}"

    # 3. All test account IDs present and unique
    assert sub["account_id"].n_unique() == 64062
    assert set(sub["account_id"]) == set(test_ref["account_id"])

    # 4. Probabilities bounded [0.0, 1.0] with no NaNs
    assert sub["is_mule"].null_count() == 0
    assert sub["is_mule"].min() >= 0.0
    assert sub["is_mule"].max() <= 1.0

    # 5. Suspicious timestamps formatting
    flagged = sub.filter(pl.col("is_mule") >= 0.5)
    assert len(flagged) > 0, "No accounts flagged with probability >= 0.5"

    sample_flag = flagged.head(1).to_dicts()[0]
    assert len(sample_flag["suspicious_start"]) == 19
    assert len(sample_flag["suspicious_end"]) == 19
    assert "T" in sample_flag["suspicious_start"]
    assert "T" in sample_flag["suspicious_end"]
