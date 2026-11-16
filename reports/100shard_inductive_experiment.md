# 100-Shard Scaled Inductive GraphSAGE Experiment: Technical Report

**Engineer**: Senior Graph ML Engineer  
**Dataset**: RBIH-NFPC Phase 2 (`D:\RBIH-NFPC-Data`) â€” 100 Transaction Shards (~100.7M raw transactions)  
**Observation Cutoff**: **December 31, 2024, 23:59:59**  
**Framing**: Retrospective Supervised Mule Detection under Split-Aware Inductive Protocol  
**Hardware**: NVIDIA GeForce RTX 3050 Laptop GPU (4.00 GB VRAM)  
**Date**: November 16, 2026  

---

## 1. Executive Summary & Scaling Overview

This experiment scales the split-aware inductive GraphSAGE architecture from 50 shards to **100 Parquet transaction shards** (~100.7 million raw transactions):
- **Transactions Scanned**: 100 main shards joined with 78 additional shards by `transaction_id`.
- **Common Historical Cutoff**: All transactions occurring after **December 31, 2024, 23:59:59** were strictly withheld.
- **Strict Split-Aware Inductive Methodology**:
  - Training counterparty features (`cp_features_train`) aggregated exclusively from training accounts.
  - Training graph topology strictly restricted to training-account incident edges.
  - Zero validation or test transactions contributed to training counterparty aggregates.
  - Purged all unversioned static snapshot flags and balance snapshots (clean 24-feature account representation).
- **Split Breakdown**:
  - **Train Set**: 16,456 accounts.
  - **Val Set**: 3,527 accounts.
  - **Test Set**: 3,527 accounts (90 mules, 3,437 legitimate).

---

## 2. Quantitative Results on Held-Out Test Set (3,527 Accounts, 90 Mules)

- **Test ROC-AUC**: **0.9319**
- **Test PR-AUC (Average Precision)**: **0.7548** (Random Baseline: **0.0255** â€” **29.6x lift**)
  - *95% Bootstrap Confidence Interval*: **[0.6498, 0.8703]**
- **Validation-Calibrated Threshold**: **0.64** (Selected strictly using validation data, Val F1: **0.7978**)
- **Test Performance @ Calibrated Threshold (0.64)**:
  - Accuracy: **98.87%** (*95% Wilson CI: [98.46%, 99.17%]*)
  - Mule Precision: **75.51%** (*95% Wilson CI: [66.14%, 82.96%]*)
  - Mule Recall: **82.22%** (74 of 90 mules captured, *95% Wilson CI: [73.06%, 88.75%]*)
  - Mule F1-Score: **0.7872**
  - Confusion Matrix: `[TN=3413, FP=24], [FN=16, TP=74]`

### Multi-Threshold Operating Spectrum (Held-Out Test Set)

| Threshold | Accuracy | Mule Precision | Mule Recall | Mule F1-Score | Confusion Matrix [TN, FP], [FN, TP] | Note |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 0.30 | 98.2% | 60.6% | 85.6% | 0.7097 | [[3387, 50], [13, 77]] | Grid Sweep |
| 0.40 | 98.6% | 68.2% | 83.3% | 0.7500 | [[3402, 35], [15, 75]] | Grid Sweep |
| 0.45 | 98.7% | 70.8% | 83.3% | 0.7653 | [[3406, 31], [15, 75]] | Grid Sweep |
| 0.50 | 98.7% | 71.2% | 82.2% | 0.7629 | [[3407, 30], [16, 74]] | Grid Sweep |
| 0.55 | 98.8% | 72.5% | 82.2% | 0.7708 | [[3409, 28], [16, 74]] | Grid Sweep |
| 0.60 | 98.8% | 74.8% | 82.2% | 0.7831 | [[3412, 25], [16, 74]] | Grid Sweep |
| 0.64 | 98.9% | 75.5% | 82.2% | 0.7872 | [[3413, 24], [16, 74]] | **Validation-Calibrated** |
| 0.65 | 98.9% | 75.5% | 82.2% | 0.7872 | [[3413, 24], [16, 74]] | Grid Sweep |
| 0.70 | 98.8% | 75.8% | 80.0% | 0.7784 | [[3414, 23], [18, 72]] | Grid Sweep |

---

## 3. Comparative Scaling Analysis: 50-Shard Inductive vs. 100-Shard Inductive

| Metric / Dimension | 50-Shard Inductive | 100-Shard Inductive | Scaling Delta |
|:---|:---:|:---:|:---:|
| **Main Transaction Shards** | 50 | **100** | **+50 shards (2.0x)** |
| **Raw Transactions Scanned** | 50.35M | **~100.7M** | **2.0x expansion** |
| **Test Mules Evaluated** | 45 | **90** | **+45 mules (2.0x)** |
| **Test ROC-AUC** | 0.9275 | **0.9319** | **+0.0044** |
| **Test PR-AUC** | 0.8093 | **0.7548** | **-0.0545** |
| **Random Baseline Lift** | 31.5x | **29.6x** | Maintained high discrimination |
| **Test Mule Precision (@ Calibrated)** | 72.5% | **75.5%** | **+3.0%** |
| **Test Mule Recall (@ Calibrated)** | 82.2% | **82.2%** | **+0.0%** |
| **Test Mule F1 (@ Calibrated)** | 0.7708 | **0.7872** | **+0.0164** |
| **Recall 95% Wilson CI Span** | [68.7%, 90.7%] (span 22.0%) | **[73.1%, 88.8%] (span 15.7%)** | **Narrower confidence interval** |
| **Hardware Telemetry** | 64.8 MB max allocated | **103.3 MB max allocated (Res: 168.0 MB)** | Scalable GPU memory |

---

## 4. Engineering Takeaways & Limitations

1. **Statistical Power & Confidence Interval Tightening**:
   Evaluating 90 test mules halved the theoretical sampling variance (-50.0%) and narrowed the 95% Wilson confidence interval width (margin of error) from 22.0% to 15.7% compared to 45 mules in the 50-shard cohort.
2. **Evaluation Protocol Distinction**:
   Test inference was performed in a single forward pass. Operational evaluation was benchmarked strictly at the validation-calibrated threshold (0.64); the multi-threshold spectrum is provided purely as a descriptive post-hoc sensitivity analysis. Test labels were never used for threshold selection.
3. **Dataset Partition Scope**:
   Shards 1-100 represent a sequential file partition (~100.7M transactions) of the 396-shard dataset, not an i.i.d. random sample.
4. **Retrospective Label Framing**:
   71.4% of labeled mules were flagged in 2025. This experiment evaluates retrospective supervised pattern recognition under a historical transaction cutoff, not prospective early forecasting.
5. **Scalability on Consumer GPU**:
   Mini-batch training with `BipartiteNeighborSampler` processed 100 shards with peak active VRAM under **103.4 MB** on the RTX 3050 GPU.
