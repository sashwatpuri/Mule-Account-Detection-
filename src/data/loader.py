"""
Metadata Loader for AML Mule Detection.
Joins accounts, customer_account_linkage, customers, demographics,
product_details, branch, and accounts-additional tables into a unified dataframe.
"""
import polars as pl

def load_account_metadata(dataset_dir="Dataset"):
    """
    Loads and merges all tabular metadata into a unified DataFrame keyed on account_id.
    """
    print("Loading tabular metadata...")
    accounts = pl.read_parquet(f"{dataset_dir}/accounts.parquet")
    accounts_add = pl.read_parquet(f"{dataset_dir}/accounts-additional.parquet")
    linkage = pl.read_parquet(f"{dataset_dir}/customer_account_linkage.parquet")
    customers = pl.read_parquet(f"{dataset_dir}/customers.parquet")
    demographics = pl.read_parquet(f"{dataset_dir}/demographics.parquet")
    product_details = pl.read_parquet(f"{dataset_dir}/product_details.parquet")
    branch = pl.read_parquet(f"{dataset_dir}/branch.parquet")

    # Merge customer data
    cust_full = customers.join(demographics, on="customer_id", how="left")
    cust_full = cust_full.join(product_details, on="customer_id", how="left")

    # Link accounts to customers
    acct_cust = linkage.join(cust_full, on="customer_id", how="left")

    # Merge into accounts
    merged = accounts.join(accounts_add, on="account_id", how="left")
    merged = merged.join(acct_cust, on="account_id", how="left")
    merged = merged.join(branch, on="branch_code", how="left")

    print(f"Unified account metadata loaded: {len(merged):,} rows, {len(merged.columns)} columns.")
    return merged

if __name__ == "__main__":
    df = load_account_metadata()
    print("Columns:", df.columns[:10])
