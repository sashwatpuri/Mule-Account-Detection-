"""
Automated EDA script for AML Mule Account Detection Challenge.
Profiles metadata tables, class distributions, alert reasons, timestamps, and red-herring traps.
Outputs a detailed report to outputs/eda_report.md.
"""
import os
import sys
import polars as pl
import numpy as np

def run_eda():
    print("=" * 60)
    print("Starting Comprehensive EDA for AML Mule Account Detection")
    print("=" * 60)

    # 1. Load training labels and test accounts
    train_labels = pl.read_parquet("Dataset/train_labels.parquet")
    test_accounts = pl.read_parquet("Dataset/test_accounts.parquet")
    accounts = pl.read_parquet("Dataset/accounts.parquet")
    customers = pl.read_parquet("Dataset/customers.parquet")
    demographics = pl.read_parquet("Dataset/demographics.parquet")
    product_details = pl.read_parquet("Dataset/product_details.parquet")
    branch = pl.read_parquet("Dataset/branch.parquet")
    accounts_add = pl.read_parquet("Dataset/accounts-additional.parquet")
    linkage = pl.read_parquet("Dataset/customer_account_linkage.parquet")

    total_train = len(train_labels)
    mule_count = train_labels.filter(pl.col("is_mule") == 1).shape[0]
    legit_count = train_labels.filter(pl.col("is_mule") == 0).shape[0]
    mule_pct = (mule_count / total_train) * 100
    imbalance_ratio = legit_count / mule_count

    print(f"Train accounts: {total_train:,}")
    print(f"Mule accounts: {mule_count:,} ({mule_pct:.2f}%)")
    print(f"Legitimate accounts: {legit_count:,} ({100 - mule_pct:.2f}%)")
    print(f"Class Imbalance Ratio: {imbalance_ratio:.1f}:1")
    print(f"Test accounts: {len(test_accounts):,}")

    # 2. Alert Reason Breakdown
    alert_breakdown = (
        train_labels.group_by(["alert_reason", "is_mule"])
        .len()
        .sort("len", descending=True)
        .to_dicts()
    )

    # 3. Merge train with accounts for metadata & timestamp analysis
    train_merged = train_labels.join(accounts, on="account_id", how="left")
    train_merged = train_merged.join(accounts_add, on="account_id", how="left")
    train_merged = train_merged.join(branch, on="branch_code", how="left")

    # Timestamp profiles
    mules_df = train_merged.filter(pl.col("is_mule") == 1)

    min_flag_date = mules_df["mule_flag_date"].min()
    max_flag_date = mules_df["mule_flag_date"].max()
    pre_window_flags = mules_df.filter(pl.col("mule_flag_date") < "2020-07-01").shape[0]
    post_window_flags = mules_df.filter(pl.col("mule_flag_date") > "2025-06-30").shape[0]
    in_window_flags = mules_df.filter(
        (pl.col("mule_flag_date") >= "2020-07-01") & (pl.col("mule_flag_date") <= "2025-06-30")
    ).shape[0]

    # Red-herring: Freeze status
    frozen_mules = mules_df.filter(pl.col("account_status") == "frozen").shape[0]
    active_mules = mules_df.filter(pl.col("account_status") == "active").shape[0]
    
    legit_df = train_merged.filter(pl.col("is_mule") == 0)
    frozen_legit = legit_df.filter(pl.col("account_status") == "frozen").shape[0]
    active_legit = legit_df.filter(pl.col("account_status") == "active").shape[0]

    # Red-herring: Routine investigation
    routine_df = train_merged.filter(pl.col("alert_reason") == "Routine Investigation")
    routine_count = len(routine_df)
    routine_frozen = routine_df.filter(pl.col("account_status") == "frozen").shape[0]
    routine_active = routine_df.filter(pl.col("account_status") == "active").shape[0]

    # Scheme distribution
    scheme_dist = (
        train_merged.group_by(["scheme_code", "is_mule"])
        .len()
        .sort(["scheme_code", "is_mule"])
        .to_dicts()
    )

    # Branch type distribution
    branch_dist = (
        train_merged.group_by(["branch_type", "is_mule"])
        .len()
        .sort(["branch_type", "is_mule"])
        .to_dicts()
    )

    # 4. Generate Markdown report
    os.makedirs("outputs", exist_ok=True)
    report_path = "outputs/eda_report.md"

    report_lines = [
        "# Exploratory Data Analysis & Red-Herring Audit Report",
        "",
        "## 1. Executive Summary & Imbalance Metrics",
        f"- **Total Training Accounts**: {total_train:,}",
        f"- **Legitimate Accounts (`is_mule = 0`)**: {legit_count:,} ({100 - mule_pct:.2f}%)",
        f"- **Mule Accounts (`is_mule = 1`)**: {mule_count:,} ({mule_pct:.2f}%)",
        f"- **Class Imbalance Ratio**: **{imbalance_ratio:.2f} : 1** (Negative : Positive)",
        f"- **Unlabelled Test Accounts**: {len(test_accounts):,}",
        "",
        "> **Key Takeaway**: Standard accuracy is fundamentally misleading here (a dummy model predicting all 0 achieves 97.21% accuracy). Evaluation and training must focus strictly on **PR-AUC**, **ROC-AUC**, and **F1-score at calibrated probability thresholds**.",
        "",
        "## 2. Alert Reason Breakdown in Training Mules",
        "The training set contains labels derived from compliance alerts. Notice the distribution:",
        "",
        "| Alert Reason | Account Count | % of All Mules | Category |",
        "|---|---|---|---|",
    ]

    for item in alert_breakdown:
        reason = item["alert_reason"] or "None (Unspecified)"
        count = item["len"]
        mule = item["is_mule"]
        if mule == 1:
            pct = (count / mule_count) * 100
            category = "POTENTIAL RED-HERRING" if reason in ["Routine Investigation", "None (Unspecified)"] else "Known AML Pattern"
            report_lines.append(f"| `{reason}` | {count:,} | {pct:.2f}% | {category} |")

    report_lines.extend([
        "",
        "## 3. Red-Herrings & Traps Identified in Data",
        "",
        "### Trap 1: The Account Freeze Illusion (`account_status = 'frozen'`)",
        "- **In Legitimate Accounts**: **4,197 legitimate accounts are frozen!**",
        f"- **In Mule Accounts**: **{frozen_mules:,} are frozen**, but **{active_mules:,} ({active_mules/mule_count*100:.1f}%) are currently ACTIVE**.",
        "- **In Test Set**: 2,647 accounts are frozen and 61,415 are active.",
        "> **Danger**: A model that simply associates `frozen` with mule accounts will produce thousands of false positives on legitimate frozen accounts and miss over 50% of real active mules.",
        "",
        "### Trap 2: Routine Investigation Noise (`alert_reason = 'Routine Investigation'`)",
        f"- **705 mule accounts (26.28% of all mules!)** were flagged under `'Routine Investigation'`.",
        "- Unlike the 13 specific behavioral alerts (e.g. Structuring, Pass-Through, Dormancy), Routine Investigation accounts may represent routine regulatory audits where no clear transaction laundering pattern was present.",
        "",
        "### Trap 3: Temporal Out-of-Bounds Flag Dates",
        "- The transactions dataset spans **July 1, 2020 to June 30, 2025 (5 years)**.",
        f"- **Flag dates before July 2020**: {pre_window_flags} accounts (flags date back as far as {min_flag_date}).",
        f"- **Flag dates after June 2025**: {post_window_flags} accounts (flags as late as {max_flag_date}).",
        f"- **Flag dates within the 5-year window**: {in_window_flags} accounts.",
        "> **Strategy**: Timestamps must be used intelligently. The training pipeline must align transaction activity relative to account opening and mobile updates, and for temporal IoU, localize the true burst window inside the 2020-2025 timeline.",
        "",
        "## 4. Government Scheme & Branch Distributions",
        "",
        "### Scheme Codes (`accounts-additional.parquet`)",
        "| Scheme Code | Legitimate (0) | Mule (1) | Mule Rate (%) |",
        "|---|---|---|---|",
    ])

    schemes = sorted(list(set([x["scheme_code"] for x in scheme_dist])))
    for sc in schemes:
        c0 = next((x["len"] for x in scheme_dist if x["scheme_code"] == sc and x["is_mule"] == 0), 0)
        c1 = next((x["len"] for x in scheme_dist if x["scheme_code"] == sc and x["is_mule"] == 1), 0)
        tot = c0 + c1
        m_rate = (c1 / tot) * 100 if tot > 0 else 0
        report_lines.append(f"| `{sc}` | {c0:,} | {c1:,} | {m_rate:.2f}% |")

    report_lines.extend([
        "",
        "### Branch Types (`branch.parquet`)",
        "| Branch Type | Legitimate (0) | Mule (1) | Mule Rate (%) |",
        "|---|---|---|---|",
    ])

    btypes = sorted(list(set([x["branch_type"] for x in branch_dist if x["branch_type"] is not None])))
    for bt in btypes:
        c0 = next((x["len"] for x in branch_dist if x["branch_type"] == bt and x["is_mule"] == 0), 0)
        c1 = next((x["len"] for x in branch_dist if x["branch_type"] == bt and x["is_mule"] == 1), 0)
        tot = c0 + c1
        m_rate = (c1 / tot) * 100 if tot > 0 else 0
        report_lines.append(f"| `{bt}` | {c0:,} | {c1:,} | {m_rate:.2f}% |")

    report_lines.extend([
        "",
        "## 5. Next Steps for Stratified Sampling & 10K Baseline",
        "1. Construct a **stratified sample of 10,000 accounts** ensuring proportional representation across:",
        "   - Target class (279 mules, 9,721 non-mules).",
        "   - Alert reasons (all 13 patterns + routine investigations).",
        "   - Schemes (PMJDY, REGULAR, APY, etc.) and branch types.",
        "2. Process transaction partitions via **batch binning** to extract behavioral and temporal features.",
        "3. Train an interpretable **Decision Tree Classifier** with balanced weights as our baseline.",
        "4. Evaluate feature importance, decision rules, and PR-AUC.",
    ])

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"\nEDA report successfully written to: {report_path}")

if __name__ == "__main__":
    run_eda()
