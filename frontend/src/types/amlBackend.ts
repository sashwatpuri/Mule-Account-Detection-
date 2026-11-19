/**
 * AML Mule Account Detection - Backend Domain Types & Field Schemas
 *
 * NOTE ON PROJECT FEATURE EXTRACTION:
 * These fields reflect the exact feature engineering schema implemented in:
 * - src/features/account_features.py (account age, kyc, freeze flags)
 * - src/features/transaction_features.py (credit/debit counts, volumes, structuring, round sums)
 * - src/features/temporal_features.py (peak month turnover, velocity)
 * - src/features/window_detector.py (temporal IoU suspicious interval)
 * - outputs/full_decision_tree_results.json (Decision Tree split logic)
 *
 * NOTE ON PREDICTION LABELS:
 * `is_mule` is a strict binary label (0 = Legitimate, 1 = Mule).
 * It must NEVER be treated as a probability percentage.
 * Continuous probabilities are only displayed if the backend model explicitly returns `mule_probability`.
 */

export interface BackendAccountFeatures {
  // 1. Primary Identifiers
  account_id: string;

  // 2. Binary Prediction / Ground Truth (0 = Legitimate, 1 = Mule)
  is_mule: number;

  // 3. Optional Model Prediction Probability (0.0 to 1.0 or 0 to 100)
  // Only present if backend runs predict_proba()
  mule_probability?: number | null;

  // 4. Temporal IoU Window Interval
  suspicious_start?: string | null;
  suspicious_end?: string | null;

  // 5. Transaction Aggregations
  total_txns?: number;
  total_volume?: number;
  credit_count?: number;
  debit_count?: number;
  credit_volume?: number;
  debit_volume?: number;

  // 6. Network Counterparty Metrics
  total_unique_cp?: number;
  fan_in_out_ratio?: number;

  // 7. Behavioral Velocity & Pattern Indicators
  pass_through_symmetry?: number; // |Credit - Debit| / (Credit + Debit)
  structuring_50k_count?: number;  // Txns in [45,000, 49,999]
  round_5k_count?: number;         // Txns in multiples of 5,000
  peak_month_volume?: number;
  active_lifespan_days?: number;

  // 8. Compliance & Administrative Timelines
  days_since_last_kyc?: number | null;
  days_since_freeze?: number | null;
  is_frozen_flag?: number; // 0 or 1
  branch_turnover?: number;
}

/**
 * Required Transaction-Level Fields for Network Analysis
 * 
 * IMPORTANT ARCHITECTURAL REQUIREMENT:
 * Aggregated account features (such as `total_unique_cp`) alone are NOT sufficient
 * to reconstruct directed transaction networks. Line-item edges require real
 * ledger entries from the database with source, target, amount, and timestamp.
 */
export interface BackendTransactionRecord {
  source_account_id: string;      // Originator account identifier
  destination_account_id: string; // Recipient account identifier
  transaction_amount: number;     // Transfer amount in INR (₹)
  timestamp: string;              // ISO 8601 or formatted date/time string
  channel?: string;               // Optional transfer method (UPI, NEFT, RTGS, IMPS)
}

/**
 * Network Topology Payload returned by GET /api/v1/network/:id
 */
export interface BackendNetworkTopologyResponse {
  root_account_id: string;
  accounts: BackendAccountFeatures[];
  transactions: BackendTransactionRecord[];
}

/**
 * Model Evaluation Summary matching outputs/full_decision_tree_results.json
 */
export interface BackendDecisionTreeResults {
  model: string;
  params: {
    max_depth: number;
    min_samples_leaf: number;
    class_weight: string;
  };
  metrics: {
    roc_auc: number;
    pr_auc: number;
    best_threshold: number;
    best_f1: number;
    precision_at_best_thresh: number;
    recall_at_best_thresh: number;
    confusion_matrix: number[][];
  };
  top_features: Array<{
    feature: string;
    importance: number;
  }>;
}

/**
 * Standard API Response Envelope
 */
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  source: 'live_backend' | 'development_mock';
  timestamp: string;
}

export interface PaginatedApiResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  source: 'live_backend' | 'development_mock';
}
