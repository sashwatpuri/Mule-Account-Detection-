/**
 * Overview Dashboard Mock Data & Domain Types
 * 
 * NOTE: These are clearly separated illustrative mock data structures for frontend development.
 * They match the RBIH Decision Tree baseline model architecture and will be replaced
 * with live backend API responses during full integration.
 */

export interface StatMetric {
  id: string;
  title: string;
  value: string;
  rawCount: number;
  changeLabel?: string;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  color: 'blue' | 'red' | 'amber' | 'green';
}

export interface RiskCategory {
  name: string;
  count: number;
  percentage: number;
  color: string;
  hex: string;
}

export interface VolumeComparison {
  category: string;
  credits: number; // Inflow
  debits: number;  // Outflow
  creditsFormatted: string;
  debitsFormatted: string;
}

export interface RiskScoreBucket {
  range: string;
  label: string;
  count: number;
  riskTier: 'low' | 'medium' | 'high';
  color: string;
}

export interface FeatureImportanceItem {
  featureKey: string;
  featureName: string;
  importance: number; // percentage
  category: string;
  interpretation: string;
}

export interface RecentSuspiciousAccount {
  accountId: string;
  riskScore: number; // 0 - 100
  riskLevel: 'High' | 'Medium' | 'Low';
  totalTransactions: number;
  totalVolume: number; // in INR
  primaryTrigger: string;
  flagDate: string;
}

// -------------------------------------------------------------
// 1. Statistics Cards Data
// -------------------------------------------------------------
export const MOCK_OVERVIEW_STATS: StatMetric[] = [
  {
    id: 'total-accounts',
    title: 'Total Accounts Analysed',
    value: '10,000',
    rawCount: 10000,
    changeLabel: 'Full Stratified Cohort',
    description: 'Evaluated accounts in test sample',
    color: 'blue',
  },
  {
    id: 'suspicious-accounts',
    title: 'Suspicious Accounts',
    value: '2,683',
    rawCount: 2683,
    changeLabel: '26.8% flagged rate',
    description: 'Total flagged for AML review',
    trend: 'up',
    color: 'amber',
  },
  {
    id: 'legitimate-accounts',
    title: 'Legitimate Accounts',
    value: '7,317',
    rawCount: 7317,
    changeLabel: '73.2% clearance rate',
    description: 'Cleared standard retail banking',
    trend: 'neutral',
    color: 'green',
  },
  {
    id: 'high-risk-accounts',
    title: 'High-Risk Accounts',
    value: '1,248',
    rawCount: 1248,
    changeLabel: 'Prob \u2265 85% \u2022 Critical',
    description: 'High confidence mule funneling',
    trend: 'up',
    color: 'red',
  },
];

// -------------------------------------------------------------
// 2. Risk Distribution Donut Chart Data
// -------------------------------------------------------------
export const MOCK_RISK_DISTRIBUTION: RiskCategory[] = [
  {
    name: 'High Risk',
    count: 1248,
    percentage: 12.48,
    color: 'text-red-400',
    hex: '#EF4444',
  },
  {
    name: 'Medium Risk',
    count: 1435,
    percentage: 14.35,
    color: 'text-amber-400',
    hex: '#F59E0B',
  },
  {
    name: 'Low Risk',
    count: 7317,
    percentage: 73.17,
    color: 'text-emerald-400',
    hex: '#10B981',
  },
];

// -------------------------------------------------------------
// 3. Transaction Volume Analysis (Credit vs Debit in \u20B9 Lakhs/Crores)
// -------------------------------------------------------------
export const MOCK_VOLUME_COMPARISON: VolumeComparison[] = [
  {
    category: 'High-Risk Accounts',
    credits: 184500000, // \u20B918.45 Cr
    debits: 181200000,  // \u20B918.12 Cr (Demonstrates rapid pass-through symmetry!)
    creditsFormatted: '\u20B918.45 Cr',
    debitsFormatted: '\u20B918.12 Cr',
  },
  {
    category: 'Medium-Risk Accounts',
    credits: 92400000,  // \u20B99.24 Cr
    debits: 78500000,   // \u20B97.85 Cr
    creditsFormatted: '\u20B99.24 Cr',
    debitsFormatted: '\u20B97.85 Cr',
  },
  {
    category: 'Low-Risk Accounts',
    credits: 146000000, // \u20B914.60 Cr
    debits: 112000000,  // \u20B911.20 Cr (Healthy resting balance retention)
    creditsFormatted: '\u20B914.60 Cr',
    debitsFormatted: '\u20B911.20 Cr',
  },
];

// -------------------------------------------------------------
// 4. Account Risk Distribution Breakdown (Bar Chart)
// -------------------------------------------------------------
export const MOCK_ACCOUNT_RISK_DISTRIBUTION: RiskScoreBucket[] = [
  {
    range: '0% - 20%',
    label: 'Negligible Risk',
    count: 5410,
    riskTier: 'low',
    color: '#10B981',
  },
  {
    range: '21% - 40%',
    label: 'Low Risk',
    count: 1907,
    riskTier: 'low',
    color: '#34D399',
  },
  {
    range: '41% - 60%',
    label: 'Moderate Risk',
    count: 812,
    riskTier: 'medium',
    color: '#FBBF24',
  },
  {
    range: '61% - 80%',
    label: 'Elevated Risk',
    count: 623,
    riskTier: 'medium',
    color: '#F59E0B',
  },
  {
    range: '81% - 100%',
    label: 'Critical Mule Risk',
    count: 1248,
    riskTier: 'high',
    color: '#EF4444',
  },
];

// -------------------------------------------------------------
// 5. Decision Tree Model Feature Importance (From full_decision_tree_results.json)
// -------------------------------------------------------------
export const MOCK_FEATURE_IMPORTANCE: FeatureImportanceItem[] = [
  {
    featureKey: 'total_unique_cp',
    featureName: 'Total Unique Counterparties',
    importance: 52.46,
    category: 'Network Fan-In / Fan-Out',
    interpretation: 'Filter for hubs interacting with >30 counterparties',
  },
  {
    featureKey: 'days_since_freeze',
    featureName: 'Days Since Freeze',
    importance: 34.42,
    category: 'Compliance Recency',
    interpretation: 'Distinguishes active AML freezes from historical dormancy',
  },
  {
    featureKey: 'is_frozen_flag',
    featureName: 'Is Account Frozen',
    importance: 6.24,
    category: 'Account State',
    interpretation: 'Partitions active accounts from restricted accounts',
  },
  {
    featureKey: 'days_since_last_kyc',
    featureName: 'Days Since Last KYC Update',
    importance: 3.21,
    category: 'Identity Tampering',
    interpretation: 'Detects recent profile edits shortly preceding fund bursts',
  },
  {
    featureKey: 'branch_turnover',
    featureName: 'Branch Turnover',
    importance: 1.90,
    category: 'Geographic Velocity',
    interpretation: 'Branch-level aggregate volume baseline comparison',
  },
];

// -------------------------------------------------------------
// 6. Recent Suspicious Accounts (Illustrative Table Data)
// -------------------------------------------------------------
export const MOCK_RECENT_SUSPICIOUS_ACCOUNTS: RecentSuspiciousAccount[] = [
  {
    accountId: 'ACC-MULE-7842',
    riskScore: 99.68,
    riskLevel: 'High',
    totalTransactions: 148,
    totalVolume: 4850000, // \u20B948,50,000
    primaryTrigger: 'Pass-Through Symmetry \u2264 0.33 & CP > 30',
    flagDate: 'Today, 10:14 IST',
  },
  {
    accountId: 'ACC-MULE-9014',
    riskScore: 98.31,
    riskLevel: 'High',
    totalTransactions: 92,
    totalVolume: 3220000, // \u20B932,20,000
    primaryTrigger: 'Aggregated Fan-Out Funnel',
    flagDate: 'Today, 09:42 IST',
  },
  {
    accountId: 'ACC-MULE-6112',
    riskScore: 96.51,
    riskLevel: 'High',
    totalTransactions: 114,
    totalVolume: 6180000, // \u20B961,80,000
    primaryTrigger: 'Recent AML Freeze \u2264 360 Days',
    flagDate: 'Yesterday, 18:20 IST',
  },
  {
    accountId: 'ACC-REV-4309',
    riskScore: 75.39,
    riskLevel: 'Medium',
    totalTransactions: 42,
    totalVolume: 1450000, // \u20B914,50,000
    primaryTrigger: 'KYC Update \u2264 41 Days + Sudden Surge',
    flagDate: 'Yesterday, 14:15 IST',
  },
  {
    accountId: 'ACC-MULE-2871',
    riskScore: 68.20,
    riskLevel: 'Medium',
    totalTransactions: 36,
    totalVolume: 980000,  // \u20B99,80,000
    primaryTrigger: 'Asymmetric Counterparty Inflow',
    flagDate: '14 Nov 2026',
  },
];

// -------------------------------------------------------------
// Currency & Number Formatting Helpers (INR - \u20B9)
// -------------------------------------------------------------
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactINR(amount: number): string {
  if (amount >= 10000000) {
    return `\u20B9${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `\u20B9${(amount / 100000).toFixed(2)} L`;
  }
  if (amount >= 1000) {
    return `\u20B9${(amount / 1000).toFixed(1)}k`;
  }
  return `\u20B9${amount.toLocaleString('en-IN')}`;
}
