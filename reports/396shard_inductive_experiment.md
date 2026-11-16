# Full 396-Shard Inductive GraphSAGE Experiment: Technical Report

**Engineer**: Senior Graph ML Engineer
**Dataset**: RBIH-NFPC Phase 2 (`D:\RBIH-NFPC-Data`) — Full 396 Transaction Shards (~398.8M raw transactions)
**Observation Cutoff**: **December 31, 2024, 23:59:59**
**Framing**: Retrospective Supervised Mule Detection under Split-Aware Inductive Protocol
**Hardware**: NVIDIA GeForce RTX 3050 Laptop GPU (4.00 GB VRAM)
**Date**: November 16, 2026

---

## 1. Executive Summary & Full-Scale Overview

This experiment runs the complete, split-aware inductive GraphSAGE pipeline across the **entire 396-shard dataset** (~398.8 million raw transactions):
- **Transactions Scanned**: All 396 main transaction shards joined with all 311 additional shards by `transaction_id`.
- **Common Historical Cutoff**: All transactions occurring after **December 31, 2024, 23:59:59** were strictly withheld.
- **Strict Split-Aware Inductive Methodology**:
  - Training counterparty features (`cp_features_train`) aggregated exclusively from training accounts.
  - Training graph topology strictly restricted to training-account incident edges.
  - Zero validation or test transactions contributed to training counterparty aggregates.
  - Purged all unversioned static snapshot flags and balance snapshots (clean 24-feature account representation).
- **Split Breakdown**:
  - **Train Set**: 65,547 accounts.
  - **Val Set**: 14,047 accounts.
  - **Test Set**: 14,047 accounts (379 ground-truth mules, 13,668 legitimate accounts).

---

## 2. Quantitative Results on Held-Out Test Set (14,047 Accounts, 379 Mules)

- **Test ROC-AUC**: **0.9293**
- **Test PR-AUC (Average Precision)**: **0.7416** (Random Baseline: **0.0270** — **27.5x lift**)
  - *95% Bootstrap Confidence Interval*: **[0.6927, 0.7895]**
- **Validation-Calibrated Threshold**: **0.84** (Selected strictly using validation data, Val F1: **0.7392**)
- **Test Performance @ Calibrated Threshold (0.84)**:
  - Accuracy: **98.43%** (*95% Wilson CI: [98.21%, 98.62%]*)
  - Mule Precision: **66.81%** (*95% Wilson CI: [62.43%, 70.91%]*)
  - Mule Recall: **82.85%** (314 of 379 mules captured, *95% Wilson CI: [78.73%, 86.31%]*)
  - Mule F1-Score: **0.7397**
  - Confusion Matrix: `[TN=13512, FP=156], [FN=65, TP=314]`

### Multi-Threshold Operating Spectrum (Held-Out Test Set)

| Threshold | Accuracy | Mule Precision | Mule Recall | Mule F1-Score | Confusion Matrix [TN, FP], [FN, TP] | Note |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 0.30 | 95.2% | 34.8% | 86.8% | 0.4966 | [[13051, 617], [50, 329]] | Grid Sweep |
| 0.40 | 96.4% | 41.6% | 86.0% | 0.5611 | [[13211, 457], [53, 326]] | Grid Sweep |
| 0.45 | 96.7% | 43.9% | 85.8% | 0.5804 | [[13252, 416], [54, 325]] | Grid Sweep |
| 0.50 | 97.0% | 46.6% | 85.8% | 0.6041 | [[13296, 372], [54, 325]] | Grid Sweep |
| 0.55 | 97.3% | 50.1% | 85.8% | 0.6329 | [[13345, 323], [54, 325]] | Grid Sweep |
| 0.60 | 97.5% | 52.4% | 85.2% | 0.6492 | [[13375, 293], [56, 323]] | Grid Sweep |
| 0.64 | 97.7% | 54.2% | 85.0% | 0.6619 | [[13396, 272], [57, 322]] | Grid Sweep |
| 0.65 | 97.7% | 55.0% | 85.0% | 0.6680 | [[13405, 263], [57, 322]] | Grid Sweep |
| 0.70 | 97.9% | 58.0% | 83.9% | 0.6861 | [[13438, 230], [61, 318]] | Grid Sweep |
| 0.84 | 98.4% | 66.8% | 82.8% | 0.7397 | [[13512, 156], [65, 314]] | **Validation-Calibrated** |

---

## 3. Comparative Scaling Analysis: 100-Shard Inductive vs. Full 396-Shard Inductive

| Metric / Dimension | 100-Shard Inductive | 396-Shard Full Scale | Scaling Delta |
|:---|:---:|:---:|:---:|
| **Main Transaction Shards** | 100 | **396** | **+296 shards (3.96x)** |
| **Raw Transactions Scanned** | ~100.7M | **~398.8M** | **~4.0x expansion** |
| **Test Mules Evaluated** | 90 | **379** | **+289 mules (4.2x)** |
| **Test ROC-AUC** | 0.9319 | **0.9293** | **-0.0026** |
| **Test PR-AUC** | 0.7548 | **0.7416** | **-0.0132** |
| **Random Baseline Lift** | 29.6x | **27.5x** | Maintained high discrimination |
| **Test Mule Precision (@ Calibrated)** | 75.5% | **66.8%** | **-8.7%** |
| **Test Mule Recall (@ Calibrated)** | 82.2% | **82.8%** | **+0.6%** |
| **Test Mule F1 (@ Calibrated)** | 0.7872 | **0.7397** | **-0.0475** |
| **Recall 95% Wilson CI Span** | [69.9%, 89.9%] (span 20.0%) | **[78.7%, 86.3%] (span 7.6%)** | **Drastically tightened error bounds** |
| **Hardware Telemetry** | 103.4 MB max allocated | **258.6 MB max allocated (Res: 886.0 MB)** | Proven out-of-core scalability on RTX 3050 |

---

## 4. Engineering Takeaways & Limitations

1. **Full Dataset Coverage**:
   All 396 main transaction shards and all 311 additional shards were processed without downsampling or truncation. The entire population of 160,153 accounts was mapped into the bipartite graph.
2. **Statistical Rigor & Tight Confidence Intervals**:
   Evaluating the complete held-out test cohort of 379 mules (compared to 90 mules in 100-shard) drastically narrowed the 95% Wilson confidence intervals, confirming that the GNN's high performance is statistically robust and generalizable.
3. **Leak-Free Inductive Protocol**:
   Zero validation or test transactions contributed to training counterparty aggregates. Edges incident to held-out accounts were strictly severed during training.
4. **Honest Retrospective Label Framing**:
   In this dataset, 71.4% of labeled mules were officially flagged during calendar year 2025. Because all transactions in this experiment occurred on or before December 31, 2024, this model is evaluated as a **retrospective supervised detector** identifying anomalous transaction and graph signatures of accounts subsequently confirmed as mules. It is not framed as a prospective early forecaster.
