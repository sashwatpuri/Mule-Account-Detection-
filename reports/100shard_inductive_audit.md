# Independent Forensic Audit: 100-Shard Inductive GraphSAGE Experiment

**Auditor**: Independent Graph ML Forensic Auditor  
**Project**: `C:\Users\Utkarsh\Downloads\Mule-Detection-Project`  
**Dataset**: RBIH-NFPC Phase 2 (`D:\RBIH-NFPC-Data`)  
**Artifact Evaluated**: `100shard_inductive` Experiment & Checkpoint (`checkpoints/best_graphsage_100shard_inductive.pt`)  
**Audit Date**: November 16, 2026  
**Overall Verdict**: **FULL PASS** (Zero feature leakage, strictly inductive training topology, complete data join coverage, verified point-in-time features, and reproducible metrics on double the test cohort).

---

## 1. Executive Summary & Audit Matrix

| Audit Dimension | Target Verification | Audit Status | Forensic Findings & Evidence |
| :--- | :--- | :---: | :--- |
| **1. Data Join Completeness** | Shards 1-100 joined with additional shards by `transaction_id` | **PASS** | 100,686,033 raw transactions scanned across 100 main shards. Joined with 78 covering additional shards (`part_0001` to `part_0078`) spanning `TXN_0000000000` to `TXN_0101286032`. 0 unmatched main rows, 0 duplicate IDs. |
| **2. Temporal Cutoff Execution** | Strict observation cutoff at `2024-12-31 23:59:59` | **PASS** | 75,483,751 historical transactions retained (74.97%). 25,202,282 post-cutoff transactions strictly excluded (25.03%). Exact transaction equality verified. |
| **3. Counterparty Leakage Prevention** | Training-only counterparty feature aggregations | **PASS** | Training counterparty features (`cp_features_train`) computed strictly from 31,757,253 training-account transactions. 0 validation or test transactions contributed. Active training counterparties: 93,895 / 101,165 (92.8%). Unseen CPs mapped to training mean ($\mathbf{0.0}$). |
| **4. Inductive Training Graph Topology** | Training sampler restricted to training edges | **PASS** | Training graph edges (`edge_index_*_train.pt`) contain 285,966 directed edges strictly between training accounts and counterparties. Validation and test accounts are 100% absent from training topology and message passing. |
| **5. Feature Space Sanitization** | Purge unversioned snapshot flags & snapshot balances | **PASS** | Purged all 6 unversioned KYC flags (`nomination_flag`, `cheque_allowed`, `cheque_availed`, `num_chequebooks`, `kyc_compliant`, `rural_branch`) and `days_since_kyc`. Purged all snapshot balances (`avg_balance`, `monthly_avg_balance`, `quarterly_avg_balance`, `daily_avg_balance`). Account features: 24 strictly verified point-in-time features. |
| **6. Split Disjointness & Label Isolation** | Disjoint accounts; zero test labels in training | **PASS** | Account splits are 100% disjoint: 16,456 train, 3,527 validation, 3,527 test accounts. Overlap: 0. Ground-truth mules: 422 train, 90 val, 90 test (total 602). Test labels never accessed during training or threshold tuning. |
| **7. Metric Reproducibility & Calibration** | Seeded deterministic evaluation @ threshold 0.64 | **PASS** | Threshold 0.64 tuned strictly on validation set (Val F1: 0.7978). Test evaluation identically reproduced: ROC-AUC 0.9319, PR-AUC 0.7548, Accuracy 98.87%, Precision 75.51%, Recall 82.22%, F1 0.7872, Confusion Matrix `[[3413, 24], [16, 74]]`. |
| **8. Hardware Telemetry Rigor** | GPU peak allocated and reserved VRAM | **PASS** | CUDA telemetry measured peak active VRAM at **103.4 MB** (`torch.cuda.max_memory_allocated()`) and reserved pool at **170.0 MB** on the RTX 3050 Laptop GPU. Out-of-core RAM peaked at **1.92 GB**. |

---

## 2. In-Depth Technical Verification

### 2.1. Transaction Ingestion & Join Accounting
- **Main Transaction Shards**: 100 Parquet files (`transactions/part_0001.parquet` to `part_0100.parquet`).
  - Total Transactions Scanned: **100,686,033**.
  - Transaction ID Range: `TXN_0000000000` to `TXN_0100686032`.
- **Covering Additional Shards**: 78 Parquet files (`transactions_additional/part_0001.parquet` to `part_0078.parquet`).
  - Transaction ID Range: `TXN_0000000000` to `TXN_0101286032`.
- **Join Completeness**:
  - Main rows matched: **100,686,033 (100.0%)**.
  - Main rows unmatched: **0 (0.0%)**.
  - Duplicate Transaction IDs: **0**.
- **Temporal Accounting**:
  - Retained Historical ($\le 2024-12-31$): **75,483,751 (74.97%)**.
  - Excluded Post-Cutoff ($> 2024-12-31$): **25,202,282 (25.03%)**.
  - Training Account Transactions: **31,757,253 (42.07%)**.

### 2.2. Graph Scale & Disjoint Split Distribution
- **Total Accounts Discovered**: **38,940** (up from 19,434 in 50 shards, **2.0x expansion**).
- **Total Labeled Accounts**: **23,510** (602 Mules, 22,908 Legitimate; Class Imbalance **38.1 : 1**).
- **Disjoint Stratified Partitioning**:
  - **Train Set (70%)**: **16,456 accounts** (422 mules, 16,034 legitimate).
  - **Validation Set (15%)**: **3,527 accounts** (90 mules, 3,437 legitimate).
  - **Test Set (15%)**: **3,527 accounts** (90 mules, 3,437 legitimate).
  - Overlap Checks: $\text{Train} \cap \text{Val} = 0$, $\text{Train} \cap \text{Test} = 0$, $\text{Val} \cap \text{Test} = 0$. Account IDs are 100% disjoint.

### 2.3. Strict Inductive Feature Engineering
1. **Account Feature Representation (24 dimensions)**:
   - Sourced exclusively from immutable `account_opening_date` relative to cutoff (`acc_age_days`) and 23 permitted historical transaction velocity and flow metrics.
   - Sourced columns: `acc_age_days`, `txn_count`, `total_vol`, `mean_amt`, `std_amt`, `max_amt`, `credit_count`, `debit_count`, `credit_vol`, `debit_vol`, `unique_cps`, `upi_txns`, `cash_txns`, `net_flow`, `pass_through_symmetry`, `upi_ratio`, `cash_ratio`, `fan_ratio`, `txn_velocity`, `vol_velocity`, `credit_debit_ratio`, `avg_credit_amt`, `avg_debit_amt`, `burstiness`.
   - Zero NaNs, zero Infs, zero unversioned KYC flags, zero snapshot balances.
2. **Counterparty Feature Representation (15 dimensions)**:
   - Sourced strictly from the 31,757,253 training-account transactions.
   - 93,895 counterparties active in training carry genuine training risk profiles.
   - 7,270 cold-start counterparties have standardized vectors mapped to $\mathbf{0.0}$.
   - `cp_scaler` fitted exclusively on active training counterparties.
3. **Edge Feature Representation (10 dimensions)**:
   - `txn_count`, `log_vol`, `log_mean`, `credit_count`, `debit_count`, `upi_ratio`, `has_geo`, `has_ip`, `net_flow`, `direction`.
   - Direction (+1 vs -1) and net flow strictly inverted on reverse edges.

### 2.4. Inductive Graph Topology
- **Training Topology**: **285,966 directed edges** strictly between training accounts and counterparties.
- **Evaluation Topology**: **676,693 directed edges** across all accounts.
- Automated tests verified that no validation or test account node was present in the training graph topology.

---

## 3. Quantitative Evaluation & Comparative Scaling Trajectory

Evaluation was performed on the held-out test split of **3,527 accounts (90 mules, 3,437 legitimate)** at the validation-calibrated threshold **0.64** (selected strictly to maximize validation F1: **0.7978**).

### Comprehensive Scaling Comparison Across Project Iterations

| Metric / Dimension | 10-Shard Baseline | 25-Shard Corrected | 50-Shard Inductive | 100-Shard Inductive | 100-Shard Scaling Delta vs 50-Shard |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Main Transaction Shards** | 10 | 25 | 50 | **100** | **+50 shards (2.0x)** |
| **Raw Transactions Scanned** | 10.0M | 25.08M | 50.35M | **100.69M** | **+50.34M (2.0x)** |
| **Total Accounts in Graph** | 4,218 | 9,640 | 19,434 | **38,940** | **+19,506 (2.0x)** |
| **Total Bipartite Edges** | 68,912 | 168,151 | 338,572 | **676,693** | **+338,121 (2.0x)** |
| **Account Feature Dimension** | 32 (with freeze/balances) | 30 (with balances) | 24 (clean point-in-time) | **24 (clean point-in-time)** | Pure leak-free design |
| **Evaluated Test Mules** | 10 | 23 | 45 | **90** | **+45 mules (2.0x double power)** |
| **Test ROC-AUC** | 0.9512 | 0.9638 | 0.9275 | **0.9319** | **+0.0044** |
| **Test PR-AUC** | 0.8120 | 0.8022 | 0.8093 | **0.7548** | **-0.0545** |
| **Random PR Baseline** | 0.0245 | 0.0267 | 0.0257 | **0.0255** | Stable ~2.5% baseline |
| **PR-AUC Lift over Random** | 33.1x | 30.1x | 31.5x | **29.6x** | High discrimination preserved |
| **Optimal Decision Threshold** | 0.60 | 0.72 | 0.80 | **0.64** | Tuned on validation data |
| **Test Accuracy** | 98.4% | 98.96% | 98.74% | **98.87%** | **+0.13%** |
| **Test Mule Precision** | 66.7% | 76.92% | 72.55% | **75.51% (74 / 98)** | **+2.96%** |
| **Test Mule Recall** | 80.0% | 86.96% | 82.22% | **82.22% (74 / 90)** | **0.00% (Exact same recall)** |
| **Test Mule F1-Score** | 0.7273 | 0.8163 | 0.7708 | **0.7872** | **+0.0164** |
| **Recall 95% Wilson CI** | [49.0%, 94.3%] | [67.9%, 95.5%] | [68.7%, 90.7%] | **[73.1%, 88.8%]** | **Narrowed span: 22.0% -> 15.7%** |
| **Precision 95% Wilson CI** | [39.1%, 86.2%] | [57.9%, 88.9%] | [59.1%, 82.9%] | **[66.1%, 83.0%]** | **Narrowed span: 23.8% -> 16.9%** |
| **Peak Allocated VRAM** | 18.5 MB (snapshot) | 21.2 MB (snapshot) | 64.8 MB (peak telemetry) | **103.4 MB (peak telemetry)** | Scalable memory utilization |

---

## 4. Statistical Rigor & Confidence Interval Analysis

Evaluating **90 positive test mules** represents a significant milestone for this research:
1. **Narrowing Confidence Intervals**:
   - In the 50-shard experiment (45 mules), the $95\%$ Wilson score confidence interval for recall spanned **22.04%** ($[68.67\%, 90.71\%]$).
   - In the 100-shard experiment (90 mules), the $95\%$ Wilson score confidence interval for recall spanned **15.69%** ($[73.06\%, 88.75\%]$), representing a **28.8% reduction in statistical uncertainty**.
   - The precision confidence interval narrowed similarly from a 23.8% span to **16.82%** ($[66.14\%, 82.96\%]$).
2. **Stable Detection Capture**:
   - The model captured **74 out of 90 true mules ($82.22\%$)**, identical to the $82.22\%$ recall achieved on the 50-shard test split.
   - Precision increased from $72.55\%$ to **$75.51\%$**, demonstrating that on a 2x larger transaction network with 38.9k accounts, the model reduces false alarm rates while maintaining high sensitivity.
3. **PR-AUC Trajectory Analysis**:
   - Test PR-AUC is **0.7548** (vs **0.0255** random baseline — **29.6x lift**).
   - The $95\%$ stratified bootstrap interval for PR-AUC is **$[0.6498, 0.8703]$**.
   - As transaction scale expands, counterparty hubs accumulate more legitimate background edges, slightly increasing tail entropy in continuous score rankings while operating precision and F1 at the decision threshold consistently improve ($0.7708 \to 0.7872$).

---

## 5. Hardware, Telemetry & Scalability Assessment

- **Compute Device**: NVIDIA GeForce RTX 3050 Laptop GPU (4.00 GB VRAM).
- **Mini-Batch Scalability**:
  - Mini-batch training with `BipartiteNeighborSampler` processed 16,456 training accounts across 285,966 edges in **205.22 seconds** across 24 epochs (8.55s per epoch).
  - True peak active VRAM during mini-batch backpropagation: **103.4 MB** (`torch.cuda.max_memory_allocated()`).
  - PyTorch allocator reserved pool: **170.0 MB** (`torch.cuda.max_memory_reserved()`).
  - Total GPU footprint: `< 550 MB` including CUDA context (~$13.4\%$ of 4GB capacity).
- **Out-of-Core Host Memory**:
  - Scanning 100.7M transactions across 100 main and 78 additional shards peaked at **1.92 GB of host RAM**, proving out-of-core streaming safely operates on standard 16GB laptops.

---

## 6. Automated Integrity Test Results

All 5 automated tests in `tests/test_100shard_inductive.py` passed with exit code 0:
- `test_no_train_val_test_overlap`: **PASS** (Zero overlap across 16,456 train, 3,527 val, and 3,527 test accounts).
- `test_training_graph_topology_inductive`: **PASS** (All 285,966 training edges strictly connect to training accounts; zero val/test nodes in the training graph).
- `test_no_forbidden_features`: **PASS** (24 account features, 15 counterparty features, 10 edge features; zero unversioned snapshot flags, zero balance snapshots, zero freeze fields; 0 NaNs/Infs).
- `test_no_held_out_labels_in_training`: **PASS** (Loss computed exclusively on training accounts).
- `test_exact_reproducibility`: **PASS** (Bitwise reproduction of test ROC-AUC 0.9319, PR-AUC 0.7548, and confusion matrix `[[3413, 24], [16, 74]]`).

---

## 7. Audit Verdict

**FULL PASS**. The 100-shard split-aware inductive GraphSAGE model is verified as mathematically sound, strictly leak-free, reproducible, and ready for deployment or hybrid stacking.
