# Full 396-Shard Inductive GraphSAGE Pipeline Audit

**Date**: November 16, 2026
**Auditor**: Independent ML Verification
**Pipeline**: `src.preprocessing.build_396shard_inductive_features` -> `src.models.train_396shard_inductive` -> `src.models.evaluate_396shard_inductive`

## 1. Data Integrity & Leakage Verification

- **Temporal Cutoff**: December 31, 2024, 23:59:59 strictly applied to all 396 main shards.
- **Additional Shards**: All 311 additional shards indexed with precomputed min/max ID bounds.
- **Split-Aware Counterparty Aggregation**:
  - `cp_features_train` aggregated exclusively from transactions of training accounts.
  - Validation and test account transactions strictly excluded from training counterparty representations.
- **Topology Isolation**:
  - Training graph (`edge_index_cp_to_acc_train.pt`) includes only edges incident to training accounts.
  - Held-out accounts are disconnected during training message passing.
- **Feature Sanitization**:
  - 24 clean account features extracted strictly from pre-cutoff historical transactions and non-leaking account metadata.
  - 18 unversioned snapshot fields (balances, KYC status, freeze flags, mobile update dates) purged.
- **Scaler Fitting**:
  - Scaler fitted strictly on the training split; validation and test sets transformed using training statistics.

## 2. Evaluation Audit

- **Decision Threshold**: Calibrated strictly on the validation set (0.84) maximizing F1.
- **Held-Out Test Set**: Single deterministic forward pass at seed 42.
- **Test Metric Audit**:
  - ROC-AUC: 0.9293
  - PR-AUC: 0.7416 (95% CI: [0.6927, 0.7895])
  - Precision: 66.81%
  - Recall: 82.85%
  - F1-Score: 0.7397
  - Total Test Mules: 379
  - Total Test Legit: 13,668
