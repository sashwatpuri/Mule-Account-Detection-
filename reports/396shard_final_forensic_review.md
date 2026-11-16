# Full 396-Shard GraphSAGE Forensic & Vulnerability Review

**Date**: November 16, 2026
**Subject**: Graph Neural Network Inductive Generalization on Full RBIH Dataset (396 Shards)

## Executive Summary

The inductive GraphSAGE pipeline was scaled to the entire 396-shard dataset (398.8M transactions, 160,153 accounts) and audited for data leakage, label timing artifacts, and statistical validity.

### Key Forensic Findings:

1. **Inductive Split Integrity**: Confirmed 0% account overlap between train (65,547), val (14,047), and test (14,047) splits. Training graph topology and counterparty feature stores contain 0 edges or aggregates from held-out accounts.
2. **Temporal Consistency**: Observation cutoff of 2024-12-31 23:59:59 was strictly enforced across all 396 shards.
3. **Label Timing Reality**: Ground truth labels in `train_labels.parquet` originate from regulatory/branch flags primarily occurring in 2025. The model detects transaction patterns indicative of mule behavior existing prior to formal regulatory flagging.
4. **Hardware Feasibility**: Out-of-core streaming feature extraction and mini-batch bipartite neighbor sampling permitted complete training on an RTX 3050 Laptop GPU (4 GB VRAM) with peak active VRAM under 150 MB.
