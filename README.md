# RBIH-NFPC AML Mule Account Detection: Dual-Track Detection Framework

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![PyTorch 2.1+](https://img.shields.io/badge/PyTorch-2.1+-ee4c2c.svg)](https://pytorch.org/)
[![PyG 2.4+](https://img.shields.io/badge/PyG-2.4+-3C2179.svg)](https://pyg.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end Machine Learning and Graph Neural Network repository for detecting money-laundering mule accounts on the **Reserve Bank Innovation Hub (RBIH) National Fraud Prevention Challenge (NFPC Phase 2)** dataset.

This repository integrates two complementary approaches:
1. **Track A: Balanced Decision Tree Baseline**: A rules-driven baseline trained on tabular behavioral features (authored by Shashwat Puri; full details in [`DECISION_TREE.md`](DECISION_TREE.md)).
2. **Track B: 100-Shard Split-Aware Inductive GraphSAGE**: An edge-aware heterogeneous Graph Neural Network scaling across 100 Parquet shards (~100.7 million transactions) with zero target, temporal, or graph leakage (authored by Utkarsh).

---

## 1. Project Directory Structure

```text
Mule-Account-Detection-Reference/
├── checkpoints/
│   └── best_graphsage_100shard_inductive.pt  # Trained GNN weights (611.7 KB)
├── config/
│   └── split_100shard.json                   # Verified disjoint stratified split mapping
├── outputs/                                  # Baseline evaluation artifacts & feature parquets
│   ├── baseline_10k_results.json
│   ├── eda_report.md
│   └── full_decision_tree_results.json
├── reports/                                  # Forensic audits and technical reports
│   ├── 100shard_final_forensic_review.md     # Independent forensic review (PASS WITH LIMITATIONS)
│   ├── 100shard_inductive_experiment.md      # Scaling technical report & metrics
│   ├── 100shard_inductive_audit.md           # Topological & feature leakage audit
│   ├── 100shard_inductive_metrics.json       # JSON metrics across all 9 operating thresholds
│   └── 100shard_inductive_training_history.json
├── scripts/
│   ├── run_100shard_gnn.py                   # Master CLI orchestrator for GNN pipeline
│   ├── run_baseline_10k.py                   # Run 10k baseline Decision Tree
│   ├── run_full_extraction.py                # Full tabular feature extraction
│   └── eda/                                  # Exploratory data analysis scripts
├── src/
│   ├── data/                                 # Tabular data loaders & batch samplers
│   │   ├── loader.py
│   │   ├── batch_sampler.py
│   │   └── full_feature_extractor.py
│   ├── features/                             # Tabular & temporal feature extractors
│   │   ├── account_features.py
│   │   ├── temporal_features.py
│   │   ├── transaction_features.py
│   │   └── window_detector.py
│   ├── graph/                                # GNN graph construction & neighbor sampling
│   │   ├── graph_builder.py
│   │   └── neighbor_sampler.py               # Memory-efficient 2-hop BipartiteNeighborSampler
│   ├── models/                               # Model architectures & training engines
│   │   ├── decision_tree_baseline.py         # Sklearn Decision Tree baseline
│   │   ├── edge_aware_sage.py                # HeteroFinancialGraphSAGE & Edge-Aware SAGEConv
│   │   ├── train_100shard_inductive.py       # Mini-batch GPU training engine
│   │   ├── evaluate_100shard_inductive.py    # Deterministic test evaluation & calibration
│   │   └── metrics.py                        # Classification metric utilities
│   └── preprocessing/                        # Out-of-core GNN streaming feature extraction
│       └── build_100shard_inductive_features.py
├── tests/
│   ├── test_100shard_inductive.py            # 5-point automated GNN integrity & leakage tests
│   ├── test_decision_tree.py                 # Baseline decision tree tests
│   └── test_sampling.py                      # Stratified sampling ratio tests
├── DECISION_TREE.md                          # Visual decision flowchart & baseline heuristics
├── requirements.txt                          # Unified project dependencies
└── README.md
```

---

## 2. Environment Setup

### 2.1. Clone Repository & Create Virtual Environment
```bash
git clone https://github.com/sashwatpuri/Mule-Account-Detection-.git
cd Mule-Account-Detection-

# Create virtual environment
python -m venv .venv

# Activate environment
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate
```

### 2.2. Install Dependencies
```bash
pip install -r requirements.txt
```

> [!TIP]
> **GPU Acceleration**: If you have an NVIDIA GPU (e.g., RTX 3050, RTX 4060, etc.), install CUDA-enabled PyTorch:
> ```bash
> pip install torch --index-url https://download.pytorch.org/whl/cu126
> ```

---

## 3. Dataset Configuration (`RBIH_DATASET_DIR`)

Raw Parquet shards and confidential banking records are **strictly excluded from Git tracking**. Any teammate can configure their local dataset location using one of three methods:

### Method 1: Environment Variable (Recommended)
Set `RBIH_DATASET_DIR` to your local dataset folder:
```powershell
# Windows PowerShell
$env:RBIH_DATASET_DIR = "D:\RBIH-NFPC-Data"
```
```bash
# Linux / macOS / Bash
export RBIH_DATASET_DIR="/path/to/RBIH-NFPC-Data"
```

### Method 2: Command-Line Argument
Pass `--dataset-dir` directly to the preprocessing or orchestration scripts:
```bash
python scripts/run_100shard_gnn.py --stage preprocess --dataset-dir "D:\RBIH-NFPC-Data"
```

### Method 3: Local Symlink / Directory
Create a symlink or directory named `Dataset` in the repository root:
```powershell
# Windows PowerShell (Run as Administrator)
New-Item -ItemType SymbolicLink -Path "Dataset" -Target "D:\RBIH-NFPC-Data"
```

---

## 4. Track B: 100-Shard Inductive GraphSAGE Pipeline

The GNN pipeline processes the first 100 transaction shards (~100.7 million transactions) under a strict historical cutoff of **December 31, 2024, 23:59:59**.

### 4.1. Quick Evaluation of Pre-Trained Weights
The repository includes the trained model weights at `checkpoints/best_graphsage_100shard_inductive.pt` (611.7 KB). Once graph tensors are generated locally:
```bash
python scripts/run_100shard_gnn.py --stage evaluate
```
This performs deterministic test inference under seed 42, calibrates the decision threshold at **0.64** using validation predictions, and computes 95% Wilson and Bootstrap confidence intervals.

---

### 4.2. End-to-End Execution Stages

You can execute individual stages or the entire pipeline using `scripts/run_100shard_gnn.py`:

#### Stage 1: Feature Extraction & Inductive Graph Construction
Streams through 100 main transaction shards and matches additional transactions by `transaction_id`:
```bash
python scripts/run_100shard_gnn.py --stage preprocess
```
*Outputs: Saved to `data/graph_100shard_inductive/` (24 account features, 15 counterparty features, 10 edge features, disjoint masks, and labels).*

#### Stage 2: Mini-Batch GraphSAGE GPU Training
Trains `HeteroFinancialGraphSAGE` with the custom `BipartiteNeighborSampler` (15 hop-1 neighbors, 10 hop-2 neighbors):
```bash
python scripts/run_100shard_gnn.py --stage train --epochs 80 --batch-size 256
```
*Hardware efficiency: Processes 100 shards with peak active VRAM under **103.4 MB** on an NVIDIA RTX 3050 Laptop GPU.*

#### Stage 3: Deterministic Test Evaluation & Metric Verification
```bash
python scripts/run_100shard_gnn.py --stage evaluate
```

#### Stage 4: Run Automated Integrity & Leakage Tests
Executes the 5-point verification suite:
```bash
python scripts/run_100shard_gnn.py --stage test
# or directly via pytest:
pytest tests/test_100shard_inductive.py
```

#### Run All Stages Sequentially:
```bash
python scripts/run_100shard_gnn.py --stage all
```

---

## 5. Track A: Decision Tree Baseline (Shashwat's Workflow)

For reproducing or inspecting the tabular Decision Tree baseline:

```bash
# 1. Run 10k baseline evaluation
python scripts/run_baseline_10k.py

# 2. Extract tabular features across all partitions
python scripts/run_full_extraction.py

# 3. Run baseline test suite
python -m pytest tests/test_decision_tree.py tests/test_sampling.py
```

*For decision rules, tree depth, and red-herring resolution, see [`DECISION_TREE.md`](DECISION_TREE.md).*

---

## 6. Performance Benchmark Comparison

| Metric / Dimension | Decision Tree Baseline (10k Sample) | 100-Shard Inductive GraphSAGE (100.7M Txns) |
| :--- | :---: | :---: |
| **Model Family** | Balanced Decision Tree | Heterogeneous Edge-Aware GraphSAGE |
| **Transaction Volume** | Sampled Partitions | **100 Parquet Shards (100.7M Txns)** |
| **Test Set Accounts** | 10,000 Out-of-Fold | **3,527 Held-Out Accounts (90 Mules)** |
| **ROC-AUC** | 0.9393 | **0.9319** |
| **PR-AUC (Average Precision)** | 0.7336 | **0.7548** (95% CI: `[0.6498, 0.8703]`) |
| **PR-AUC Lift over Random** | 26.3x | **29.58x Lift** (Random baseline: 0.0255) |
| **Operating Decision Threshold** | 0.50 (Balanced) | **0.64 (Validation-Calibrated)** |
| **Mule Precision** | 77.51% | **75.51%** (95% Wilson CI: `[66.14%, 82.96%]`) |
| **Mule Recall** | 80.29% | **82.22%** (74 of 90 mules captured) |
| **Mule F1-Score** | 0.7887 | **0.7872** |
| **Test Accuracy** | 98.91% | **98.87%** (3,487 / 3,527 accounts correct) |
| **Confusion Matrix** | `[[9656, 65], [55, 224]]` | `[[3413, 24], [16, 74]]` (24 FP, 16 FN) |
| **GPU Memory Footprint** | CPU-only | **103.4 MB Peak VRAM** (RTX 3050 Laptop) |

---

## 7. Zero-Leakage & Forensic Verification Guarantee

The 100-shard GraphSAGE pipeline was independently audited and awarded a **`PASS WITH LIMITATIONS`** verdict (see [`reports/100shard_final_forensic_review.md`](reports/100shard_final_forensic_review.md)):

1. **Split-Aware Counterparty Isolation**:
   - Counterparty features were fitted **strictly over the 31,757,253 training-account transactions**.
   - Held-out validation and test accounts contributed **0.0%** to counterparty statistics.
2. **Inductive Training Topology**:
   - Training graph topology contains **285,966 directed edges** strictly incident to training accounts.
   - Message passing during training is physically isolated from validation or test nodes.
3. **Common Historical Cutoff**:
   - All transactions occurring after **2024-12-31 23:59:59** were filtered out.
4. **Purged Snapshot Fields**:
   - Excluded unversioned KYC flags (`kyc_compliant`, `cheque_allowed`), snapshot balances (`avg_balance`, `monthly_avg_balance`), and freeze dates (`is_frozen_flag`, `days_since_freeze`).
5. **Validation Threshold Calibration**:
   - The primary decision threshold (**0.64**) was derived exclusively from validation predictions ($F_1 = 0.7978$). Test labels were never accessed for threshold tuning.

---

## 8. Authors & Contributions

- **Shashwat Puri**: Tabular feature extraction pipeline, exploratory data analysis, Decision Tree baseline, and window detector.
- **Utkarsh**: Heterogeneous Edge-Aware GraphSAGE architecture, out-of-core streaming 100-shard graph feature engineering, split-aware inductive protocol, GPU mini-batch neighbor sampler, and forensic audit validation suite.
