/**
 * Suspicious Accounts Mock Dataset & Types
 * 
 * NOTE: Illustrative mock dataset strictly isolated for frontend triage simulation.
 * Attributes align with features extracted by the project's Python pipeline:
 * - total_unique_cp (Unique Counterparties)
 * - suspicious_start / suspicious_end (Temporal IoU window detector)
 * - transaction volume (INR)
 * - decision tree risk probabilities
 */

export type RiskLevel = 'High' | 'Medium' | 'Low';

export interface SuspiciousAccountItem {
  accountId: string;
  riskScore: number; // 0 - 100 percentage probability
  riskLevel: RiskLevel;
  totalTransactions: number;
  totalVolume: number; // in INR (\u20B9)
  uniqueCounterparties: number; // total_unique_cp
  suspiciousStart: string; // ISO date / readable
  suspiciousEnd: string;   // ISO date / readable
  primaryTrigger: string;
  isFrozen: boolean;
  daysSinceLastKyc: number;
  branchCode: string;
}

export interface SuspiciousAccountsFilterState {
  searchQuery: string;
  riskLevel: string; // 'all' | 'high' | 'medium' | 'low'
  riskScoreRange: string; // 'all' | '0-50' | '50-75' | '75-100'
  volumeRange: string; // 'all' | 'low' | 'medium' | 'high'
}

// -------------------------------------------------------------
// Illustrative Mock Accounts List (Representative Cohort)
// -------------------------------------------------------------
export const MOCK_SUSPICIOUS_ACCOUNTS: SuspiciousAccountItem[] = [
  {
    accountId: 'ACC-MULE-7842',
    riskScore: 99.68,
    riskLevel: 'High',
    totalTransactions: 148,
    totalVolume: 4850000, // \u20B948.50 Lakhs (Medium)
    uniqueCounterparties: 42,
    suspiciousStart: '2026-09-02',
    suspiciousEnd: '2026-09-28',
    primaryTrigger: 'Pass-Through Symmetry \u2264 0.33 & CP > 30.5',
    isFrozen: true,
    daysSinceLastKyc: 18,
    branchCode: 'BR-0491-MUM',
  },
  {
    accountId: 'ACC-MULE-9014',
    riskScore: 98.31,
    riskLevel: 'High',
    totalTransactions: 215,
    totalVolume: 8420000, // \u20B984.20 Lakhs (High)
    uniqueCounterparties: 56,
    suspiciousStart: '2026-08-14',
    suspiciousEnd: '2026-09-12',
    primaryTrigger: 'Aggregated Fan-Out Disbursement Hub',
    isFrozen: false,
    daysSinceLastKyc: 29,
    branchCode: 'BR-1102-DEL',
  },
  {
    accountId: 'ACC-MULE-6112',
    riskScore: 96.51,
    riskLevel: 'High',
    totalTransactions: 114,
    totalVolume: 6180000, // \u20B961.80 Lakhs (High)
    uniqueCounterparties: 38,
    suspiciousStart: '2026-09-10',
    suspiciousEnd: '2026-10-05',
    primaryTrigger: 'Recent AML Freeze \u2264 360 Days',
    isFrozen: true,
    daysSinceLastKyc: 120,
    branchCode: 'BR-0210-BLR',
  },
  {
    accountId: 'ACC-MULE-8430',
    riskScore: 94.75,
    riskLevel: 'High',
    totalTransactions: 98,
    totalVolume: 5300000, // \u20B953.00 Lakhs (High)
    uniqueCounterparties: 34,
    suspiciousStart: '2026-09-18',
    suspiciousEnd: '2026-10-15',
    primaryTrigger: 'High-Volume Fan-In Funneling',
    isFrozen: false,
    daysSinceLastKyc: 35,
    branchCode: 'BR-0789-HYD',
  },
  {
    accountId: 'ACC-MULE-5192',
    riskScore: 88.40,
    riskLevel: 'High',
    totalTransactions: 76,
    totalVolume: 3950000, // \u20B939.50 Lakhs (Medium)
    uniqueCounterparties: 32,
    suspiciousStart: '2026-08-25',
    suspiciousEnd: '2026-09-22',
    primaryTrigger: 'Structuring Pattern (\u20B945k-\u20B950k clusters)',
    isFrozen: false,
    daysSinceLastKyc: 22,
    branchCode: 'BR-0341-PUN',
  },
  {
    accountId: 'ACC-MULE-3341',
    riskScore: 82.10,
    riskLevel: 'High',
    totalTransactions: 64,
    totalVolume: 2450000, // \u20B924.50 Lakhs (Medium)
    uniqueCounterparties: 31,
    suspiciousStart: '2026-09-05',
    suspiciousEnd: '2026-09-30',
    primaryTrigger: 'Rapid Velocity Pass-Through Window',
    isFrozen: false,
    daysSinceLastKyc: 14,
    branchCode: 'BR-0612-KOL',
  },
  {
    accountId: 'ACC-REV-4309',
    riskScore: 75.39,
    riskLevel: 'Medium',
    totalTransactions: 52,
    totalVolume: 1450000, // \u20B914.50 Lakhs (Medium)
    uniqueCounterparties: 18,
    suspiciousStart: '2026-09-12',
    suspiciousEnd: '2026-10-08',
    primaryTrigger: 'KYC Update \u2264 41 Days + Volume Surge',
    isFrozen: false,
    daysSinceLastKyc: 9,
    branchCode: 'BR-0955-CHE',
  },
  {
    accountId: 'ACC-REV-7721',
    riskScore: 71.80,
    riskLevel: 'Medium',
    totalTransactions: 48,
    totalVolume: 1820000, // \u20B918.20 Lakhs (Medium)
    uniqueCounterparties: 22,
    suspiciousStart: '2026-08-30',
    suspiciousEnd: '2026-09-25',
    primaryTrigger: 'Sudden Inflow Symmetry Surge',
    isFrozen: false,
    daysSinceLastKyc: 25,
    branchCode: 'BR-0114-AHM',
  },
  {
    accountId: 'ACC-REV-2871',
    riskScore: 68.20,
    riskLevel: 'Medium',
    totalTransactions: 36,
    totalVolume: 980000,  // \u20B99.80 Lakhs (Low)
    uniqueCounterparties: 16,
    suspiciousStart: '2026-09-15',
    suspiciousEnd: '2026-10-10',
    primaryTrigger: 'Asymmetric Multi-Party Inflow',
    isFrozen: false,
    daysSinceLastKyc: 38,
    branchCode: 'BR-0544-JAI',
  },
  {
    accountId: 'ACC-REV-6619',
    riskScore: 62.45,
    riskLevel: 'Medium',
    totalTransactions: 41,
    totalVolume: 840000,  // \u20B98.40 Lakhs (Low)
    uniqueCounterparties: 14,
    suspiciousStart: '2026-09-08',
    suspiciousEnd: '2026-10-02',
    primaryTrigger: 'Consecutive Round-Sum Credits (\u20B95,000 multiples)',
    isFrozen: false,
    daysSinceLastKyc: 41,
    branchCode: 'BR-0892-LKO',
  },
  {
    accountId: 'ACC-REV-1092',
    riskScore: 54.10,
    riskLevel: 'Medium',
    totalTransactions: 28,
    totalVolume: 620000,  // \u20B96.20 Lakhs (Low)
    uniqueCounterparties: 12,
    suspiciousStart: '2026-09-20',
    suspiciousEnd: '2026-10-14',
    primaryTrigger: 'Elevated ATM Withdrawal Velocity',
    isFrozen: false,
    daysSinceLastKyc: 85,
    branchCode: 'BR-0401-NAG',
  },
  {
    accountId: 'ACC-RET-9943',
    riskScore: 38.60,
    riskLevel: 'Low',
    totalTransactions: 22,
    totalVolume: 490000,  // \u20B94.90 Lakhs (Low)
    uniqueCounterparties: 8,
    suspiciousStart: '2026-09-01',
    suspiciousEnd: '2026-09-22',
    primaryTrigger: 'Minor Inflow Burst (Retail Threshold)',
    isFrozen: false,
    daysSinceLastKyc: 190,
    branchCode: 'BR-0122-IND',
  },
  {
    accountId: 'ACC-RET-8812',
    riskScore: 24.15,
    riskLevel: 'Low',
    totalTransactions: 19,
    totalVolume: 320000,  // \u20B93.20 Lakhs (Low)
    uniqueCounterparties: 6,
    suspiciousStart: '2026-08-20',
    suspiciousEnd: '2026-09-10',
    primaryTrigger: 'Standard Merchant Interaction',
    isFrozen: false,
    daysSinceLastKyc: 340,
    branchCode: 'BR-0233-SUR',
  },
  {
    accountId: 'ACC-RET-5501',
    riskScore: 12.30,
    riskLevel: 'Low',
    totalTransactions: 14,
    totalVolume: 180000,  // \u20B91.80 Lakhs (Low)
    uniqueCounterparties: 4,
    suspiciousStart: '2026-09-10',
    suspiciousEnd: '2026-09-30',
    primaryTrigger: 'Regular Salary & Utility Outflows',
    isFrozen: false,
    daysSinceLastKyc: 410,
    branchCode: 'BR-0654-BHO',
  },
  {
    accountId: 'ACC-RET-2190',
    riskScore: 5.40,
    riskLevel: 'Low',
    totalTransactions: 9,
    totalVolume: 95000,   // \u20B995,000 (Low)
    uniqueCounterparties: 3,
    suspiciousStart: '2026-09-14',
    suspiciousEnd: '2026-09-28',
    primaryTrigger: 'Low-Volume Clean Account',
    isFrozen: false,
    daysSinceLastKyc: 520,
    branchCode: 'BR-0311-COI',
  },
];

// Summary Statistics for Cards
export const MOCK_SUSPICIOUS_SUMMARY = {
  totalFlagged: 2683,
  highRisk: 1248,
  mediumRisk: 1435,
  lowRiskCohort: 7317,
};

// Date Formatter Helper
export function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
  } catch {
    return dateStr;
  }
}
