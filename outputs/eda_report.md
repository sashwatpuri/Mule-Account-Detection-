# Exploratory Data Analysis & Red-Herring Audit Report

## 1. Executive Summary & Imbalance Metrics
- **Total Training Accounts**: 96,091
- **Legitimate Accounts (`is_mule = 0`)**: 93,408 (97.21%)
- **Mule Accounts (`is_mule = 1`)**: 2,683 (2.79%)
- **Class Imbalance Ratio**: **34.81 : 1** (Negative : Positive)
- **Unlabelled Test Accounts**: 64,062

> **Key Takeaway**: Standard accuracy is fundamentally misleading here (a dummy model predicting all 0 achieves 97.21% accuracy). Evaluation and training must focus strictly on **PR-AUC**, **ROC-AUC**, and **F1-score at calibrated probability thresholds**.

## 2. Alert Reason Breakdown in Training Mules
The training set contains labels derived from compliance alerts. Notice the distribution:

| Alert Reason | Account Count | % of All Mules | Category |
|---|---|---|---|
| `Routine Investigation` | 705 | 26.28% | POTENTIAL RED-HERRING |
| `None (Unspecified)` | 245 | 9.13% | POTENTIAL RED-HERRING |
| `Dormant Account Reactivation` | 188 | 7.01% | Known AML Pattern |
| `Rapid Movement of Funds` | 177 | 6.60% | Known AML Pattern |
| `MCC-Amount Distribution Anomaly` | 150 | 5.59% | Known AML Pattern |
| `Structuring Transactions Below Threshold` | 146 | 5.44% | Known AML Pattern |
| `Geographic Anomaly Detected` | 144 | 5.37% | Known AML Pattern |
| `Unusual Fund Flow Pattern` | 141 | 5.26% | Known AML Pattern |
| `Income-Transaction Mismatch` | 134 | 4.99% | Known AML Pattern |
| `Branch Cluster Investigation` | 128 | 4.77% | Known AML Pattern |
| `High-Value Activity on New Account` | 120 | 4.47% | Known AML Pattern |
| `Post-Contact-Update Spike` | 109 | 4.06% | Known AML Pattern |
| `Round Amount Pattern` | 105 | 3.91% | Known AML Pattern |
| `Layered Transaction Pattern` | 98 | 3.65% | Known AML Pattern |
| `Salary Cycle Anomaly` | 93 | 3.47% | Known AML Pattern |

## 3. Red-Herrings & Traps Identified in Data

### Trap 1: The Account Freeze Illusion (`account_status = 'frozen'`)
- **In Legitimate Accounts**: **4,197 legitimate accounts are frozen!**
- **In Mule Accounts**: **1,318 are frozen**, but **1,365 (50.9%) are currently ACTIVE**.
- **In Test Set**: 2,647 accounts are frozen and 61,415 are active.
> **Danger**: A model that simply associates `frozen` with mule accounts will produce thousands of false positives on legitimate frozen accounts and miss over 50% of real active mules.

### Trap 2: Routine Investigation Noise (`alert_reason = 'Routine Investigation'`)
- **705 mule accounts (26.28% of all mules!)** were flagged under `'Routine Investigation'`.
- Unlike the 13 specific behavioral alerts (e.g. Structuring, Pass-Through, Dormancy), Routine Investigation accounts may represent routine regulatory audits where no clear transaction laundering pattern was present.

### Trap 3: Temporal Out-of-Bounds Flag Dates
- The transactions dataset spans **July 1, 2020 to June 30, 2025 (5 years)**.
- **Flag dates before July 2020**: 46 accounts (flags date back as far as 2015-09-05).
- **Flag dates after June 2025**: 754 accounts (flags as late as 2026-03-20).
- **Flag dates within the 5-year window**: 1883 accounts.
> **Strategy**: Timestamps must be used intelligently. The training pipeline must align transaction activity relative to account opening and mobile updates, and for temporal IoU, localize the true burst window inside the 2020-2025 timeline.

## 4. Government Scheme & Branch Distributions

### Scheme Codes (`accounts-additional.parquet`)
| Scheme Code | Legitimate (0) | Mule (1) | Mule Rate (%) |
|---|---|---|---|
| `APY` | 1,826 | 42 | 2.25% |
| `PMJDY` | 13,945 | 396 | 2.76% |
| `PMJJBY` | 2,793 | 98 | 3.39% |
| `PMSBY` | 4,640 | 132 | 2.77% |
| `REGULAR` | 67,462 | 1,930 | 2.78% |
| `SCSS` | 1,829 | 60 | 3.18% |
| `SSA` | 913 | 25 | 2.67% |

### Branch Types (`branch.parquet`)
| Branch Type | Legitimate (0) | Mule (1) | Mule Rate (%) |
|---|---|---|---|
| `rural` | 13,580 | 427 | 3.05% |
| `semi-urban` | 23,584 | 713 | 2.93% |
| `urban` | 56,244 | 1,543 | 2.67% |

## 5. Next Steps for Stratified Sampling & 10K Baseline
1. Construct a **stratified sample of 10,000 accounts** ensuring proportional representation across:
   - Target class (279 mules, 9,721 non-mules).
   - Alert reasons (all 13 patterns + routine investigations).
   - Schemes (PMJDY, REGULAR, APY, etc.) and branch types.
2. Process transaction partitions via **batch binning** to extract behavioral and temporal features.
3. Train an interpretable **Decision Tree Classifier** with balanced weights as our baseline.
4. Evaluate feature importance, decision rules, and PR-AUC.