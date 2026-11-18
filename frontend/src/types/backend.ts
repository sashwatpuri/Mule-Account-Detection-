/**
 * Backend Schema & Data Transfer Object (DTO) Definitions
 * 
 * Directly aligned with features extracted in:
 * - src/features/account_features.py
 * - src/features/transaction_features.py
 * - src/features/temporal_features.py
 * - src/features/window_detector.py
 * - outputs/full_decision_tree_results.json
 */

export interface RawBackendAccountRecord {
  account_id: string;
  is_mule?: number; // Binary classification: 0 (legitimate) or 1 (mule)
  mule_probability?: number | null; // Optional continuous risk probability
  suspicious_start?: string | null; // ISO timestamp or date
  suspicious_end?: string | null;   // ISO timestamp or date
  total_txns?: number;
  total_volume?: number;
  credit_count?: number;
  debit_count?: number;
  credit_volume?: number;
  debit_volume?: number;
  total_unique_cp?: number;
  fan_in_out_ratio?: number;
  pass_through_symmetry?: number;
  structuring_50k_count?: number;
  round_5k_count?: number;
  peak_month_volume?: number;
  peak_month_txns?: number;
  active_lifespan_days?: number;
  days_since_last_kyc?: number | null;
  days_since_freeze?: number | null;
  is_frozen_flag?: number;
  branch_turnover?: number;
  min_amount?: number;
}

export interface RawBackendTransactionRecord {
  txn_id?: string;
  source_account: string;
  target_account: string;
  amount: number;
  timestamp: string;
  channel?: string;
}

export interface RawBackendModelMetrics {
  model_name: string;
  max_depth: number;
  min_samples_leaf: number;
  class_weight: string;
  roc_auc: number;
  pr_auc: number;
  best_threshold: number;
  best_f1: number;
  precision: number;
  recall: number;
  confusion_matrix: number[][];
  top_features: Array<{
    feature: string;
    importance: number;
  }>;
}
