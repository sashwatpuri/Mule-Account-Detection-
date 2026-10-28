"""
Transaction behavioral pattern analyzer on sample partitions.
Compares mules vs legitimate accounts on:
- Velocity & amounts
- Structuring near 50,000 threshold
- Channels (UPI, IMPS, ATM, Cheque)
- Round number frequencies
"""
import polars as pl
from glob import glob

def analyze_sample_transactions():
    print("=" * 60)
    print("Analyzing Transaction Patterns on Sample Batches")
    print("=" * 60)

    train_labels = pl.read_parquet("Dataset/train_labels.parquet")
    mule_ids = set(train_labels.filter(pl.col("is_mule") == 1)["account_id"].to_list())
    legit_ids = set(train_labels.filter(pl.col("is_mule") == 0)["account_id"].to_list())

    # Read first 5 transaction partitions
    parts = sorted(glob("Dataset/transactions/batch-1/part_*.parquet"))[:5]
    print(f"Reading {len(parts)} sample transaction partitions...")
    
    dfs = []
    for p in parts:
        dfs.append(pl.read_parquet(p))
    txns = pl.concat(dfs)
    print(f"Loaded {len(txns):,} sample transactions across {txns['account_id'].n_unique():,} accounts.")

    # Tag accounts
    txns = txns.with_columns([
        pl.when(pl.col("account_id").is_in(list(mule_ids)))
        .then(1)
        .when(pl.col("account_id").is_in(list(legit_ids)))
        .then(0)
        .otherwise(None)
        .alias("is_mule")
    ]).filter(pl.col("is_mule").is_not_null())

    mule_txns = txns.filter(pl.col("is_mule") == 1)
    legit_txns = txns.filter(pl.col("is_mule") == 0)

    print(f"\nSample Mules: {mule_txns['account_id'].n_unique()} accounts, {len(mule_txns):,} transactions")
    print(f"Sample Legit: {legit_txns['account_id'].n_unique()} accounts, {len(legit_txns):,} transactions")

    # 1. Transaction amounts
    print("\n--- Transaction Amount Statistics (INR) ---")
    print(f"Mule Mean Amount: ₹{mule_txns['amount'].mean():,.2f}, Median: ₹{mule_txns['amount'].median():,.2f}, Max: ₹{mule_txns['amount'].max():,.2f}")
    print(f"Legit Mean Amount: ₹{legit_txns['amount'].mean():,.2f}, Median: ₹{legit_txns['amount'].median():,.2f}, Max: ₹{legit_txns['amount'].max():,.2f}")

    # 2. Structuring near 50k (45,000 to 49,999)
    mule_50k = mule_txns.filter((pl.col("amount") >= 45000) & (pl.col("amount") < 50000)).shape[0]
    legit_50k = legit_txns.filter((pl.col("amount") >= 45000) & (pl.col("amount") < 50000)).shape[0]
    print(f"\n--- Structuring Patterns (₹45,000 - ₹49,999) ---")
    print(f"Mule near-50k count: {mule_50k} ({mule_50k / len(mule_txns) * 100:.3f}% of mule txns)")
    print(f"Legit near-50k count: {legit_50k} ({legit_50k / len(legit_txns) * 100:.3f}% of legit txns)")

    # 3. Round amounts (multiples of 5k, 10k)
    mule_round = mule_txns.filter(pl.col("amount") % 5000 == 0).shape[0]
    legit_round = legit_txns.filter(pl.col("amount") % 5000 == 0).shape[0]
    print(f"\n--- Round Multiples of ₹5,000 ---")
    print(f"Mule round 5k count: {mule_round} ({mule_round / len(mule_txns) * 100:.3f}%)")
    print(f"Legit round 5k count: {legit_round} ({legit_round / len(legit_txns) * 100:.3f}%)")

    # 4. Top channels
    print(f"\n--- Top Channels for Mules vs Legitimate ---")
    m_chan = mule_txns.group_by("channel").len().sort("len", descending=True).head(5).to_dicts()
    l_chan = legit_txns.group_by("channel").len().sort("len", descending=True).head(5).to_dicts()
    print("Mule top channels:", m_chan)
    print("Legit top channels:", l_chan)

if __name__ == "__main__":
    analyze_sample_transactions()
