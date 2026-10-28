"""
Unit tests for stratified sampling and batch binning.
"""
import polars as pl
from src.data.batch_sampler import get_stratified_sample_accounts

def test_stratified_sampling_ratio():
    sample = get_stratified_sample_accounts(n_samples=1000, random_state=42)
    assert len(sample) == 1000
    
    # Check positive ratio is approximately 2.79% (+- 0.5%)
    mule_c = sample.filter(pl.col("is_mule") == 1).shape[0]
    mule_pct = mule_c / len(sample) * 100
    assert 2.0 <= mule_pct <= 3.5, f"Expected ~2.79% mules, got {mule_pct:.2f}%"

def test_sampling_disjoint_account_ids():
    sample = get_stratified_sample_accounts(n_samples=500, random_state=42)
    assert sample["account_id"].n_unique() == 500
