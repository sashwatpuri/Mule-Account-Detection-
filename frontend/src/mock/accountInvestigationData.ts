/**
 * Account Investigation Mock Data & Feature Definitions
 *
 * NOTE: Features strictly follow the AML feature extraction pipeline in src/features/:
 * - total_unique_cp (counterparty feature)
 * - pass_through_symmetry (|Credits - Debits| / (Credits + Debits))
 * - structuring_50k_count (transactions between \u20B945,000 and \u20B949,999)
 * - round_5k_count (transactions in multiples of \u20B95,000)
 * - is_frozen_flag & days_since_freeze (freeze compliance features)
 * - days_since_last_kyc (identity/tampering recency)
 * - active_lifespan_days (account age/lifespan)
 * - peak_month_volume (peak transaction volume in single calendar month)
 * - suspicious_start & suspicious_end (temporal IoU window detector)
 */

import { RiskLevel } from './suspiciousAccountsData';
import { INITIAL_GRAPH_EDGES } from './networkGraphData';

export interface AccountTransactionRecord {
  id: string;
  timestamp: string;
  sourceAccount: string;
  targetAccount: string;
  amount: number; // in INR (\u20B9)
  direction: 'Inflow' | 'Outflow';
}

export interface ActivityTimelinePoint {
  date: string;
  volume: number; // in INR
  transactionCount: number;
  isInSuspiciousWindow: boolean;
}

export interface AccountInvestigationData {
  accountId: string;
  predictionStatus: 'Mule' | 'Non-Mule';
  riskScore: number | null; // Probability only when available
  riskLevel: RiskLevel;
  accountStatus: 'Active' | 'Frozen' | 'Restricted';
  branchCode: string;
  panNumber: string;

  // Transaction summary
  totalTransactions: number;
  totalVolume: number; // Credits + Debits
  totalCreditVolume: number; // Inflow
  totalDebitVolume: number;  // Outflow
  uniqueCounterparties: number;

  // Suspicious Activity Period
  suspiciousStart: string | null; // e.g. '2026-09-02'
  suspiciousEnd: string | null;   // e.g. '2026-09-28'
  activityDurationDays: number | null;

  // Behavioral features from ML pipeline
  features: {
    total_unique_cp: number;
    pass_through_symmetry: number;
    structuring_50k_count: number;
    round_5k_count: number;
    is_frozen_flag: number;
    days_since_freeze: number | null;
    days_since_last_kyc: number | null;
    active_lifespan_days: number;
    peak_month_volume: number;
  };

  // Activity Timeline points
  timeline: ActivityTimelinePoint[];

  // Granular transaction history
  transactions: AccountTransactionRecord[];
}

// -------------------------------------------------------------
// Detailed Investigation Records for Common Key Suspect Accounts
// -------------------------------------------------------------
export const DETAILED_INVESTIGATION_ACCOUNTS: Record<string, AccountInvestigationData> = {
  'ACC-MULE-7842': {
    accountId: 'ACC-MULE-7842',
    predictionStatus: 'Mule',
    riskScore: 99.68,
    riskLevel: 'High',
    accountStatus: 'Frozen',
    branchCode: 'BR-0491-MUM',
    panNumber: 'ABCDE1234F',
    totalTransactions: 148,
    totalVolume: 4850000,
    totalCreditVolume: 2450000,
    totalDebitVolume: 2400000,
    uniqueCounterparties: 42,
    suspiciousStart: '2026-09-02',
    suspiciousEnd: '2026-09-28',
    activityDurationDays: 26,
    features: {
      total_unique_cp: 42,
      pass_through_symmetry: 0.08, // Very close to 0 -> Near equal inflow and outflow
      structuring_50k_count: 16,  // High structuring under threshold
      round_5k_count: 34,         // Round amounts in multiples of 5000
      is_frozen_flag: 1,
      days_since_freeze: 24,      // Recent freeze (< 360 days) -> Active AML alert
      days_since_last_kyc: 18,    // Recent KYC update (< 41.5 days) -> Account takeover pattern
      active_lifespan_days: 64,
      peak_month_volume: 3820000,
    },
    timeline: [
      { date: 'Aug 10', volume: 120000, transactionCount: 4, isInSuspiciousWindow: false },
      { date: 'Aug 20', volume: 150000, transactionCount: 5, isInSuspiciousWindow: false },
      { date: 'Sep 02', volume: 680000, transactionCount: 22, isInSuspiciousWindow: true },
      { date: 'Sep 09', volume: 1120000, transactionCount: 36, isInSuspiciousWindow: true },
      { date: 'Sep 16', volume: 1450000, transactionCount: 44, isInSuspiciousWindow: true },
      { date: 'Sep 23', volume: 980000, transactionCount: 30, isInSuspiciousWindow: true },
      { date: 'Sep 30', volume: 190000, transactionCount: 5, isInSuspiciousWindow: false },
      { date: 'Oct 07', volume: 160000, transactionCount: 2, isInSuspiciousWindow: false },
    ],
    transactions: [
      {
        id: 'TXN-7842-01',
        timestamp: '15 Sep 2026, 10:20 IST',
        sourceAccount: 'ACC-REV-4309',
        targetAccount: 'ACC-MULE-7842',
        amount: 250000,
        direction: 'Inflow',
      },
      {
        id: 'TXN-7842-02',
        timestamp: '16 Sep 2026, 12:30 IST',
        sourceAccount: 'ACC-MULE-5192',
        targetAccount: 'ACC-MULE-7842',
        amount: 980000,
        direction: 'Inflow',
      },
      {
        id: 'TXN-7842-03',
        timestamp: '17 Sep 2026, 09:15 IST',
        sourceAccount: 'ACC-MULE-7842',
        targetAccount: 'ACC-MULE-9014',
        amount: 1250000,
        direction: 'Outflow',
      },
      {
        id: 'TXN-7842-04',
        timestamp: '17 Sep 2026, 11:50 IST',
        sourceAccount: 'ACC-MULE-7842',
        targetAccount: 'ACC-MULE-3341',
        amount: 850000,
        direction: 'Outflow',
      },
      {
        id: 'TXN-7842-05',
        timestamp: '18 Sep 2026, 14:10 IST',
        sourceAccount: 'ACC-EXT-1044',
        targetAccount: 'ACC-MULE-7842',
        amount: 49500,
        direction: 'Inflow',
      },
      {
        id: 'TXN-7842-06',
        timestamp: '18 Sep 2026, 16:40 IST',
        sourceAccount: 'ACC-MULE-7842',
        targetAccount: 'ACC-EXT-9981',
        amount: 49000,
        direction: 'Outflow',
      },
    ],
  },
  'ACC-MULE-9014': {
    accountId: 'ACC-MULE-9014',
    predictionStatus: 'Mule',
    riskScore: 98.31,
    riskLevel: 'High',
    accountStatus: 'Active',
    branchCode: 'BR-1102-DEL',
    panNumber: 'FGHIJ5678K',
    totalTransactions: 215,
    totalVolume: 8420000,
    totalCreditVolume: 4320000,
    totalDebitVolume: 4100000,
    uniqueCounterparties: 56,
    suspiciousStart: '2026-08-14',
    suspiciousEnd: '2026-09-12',
    activityDurationDays: 29,
    features: {
      total_unique_cp: 56,
      pass_through_symmetry: 0.12,
      structuring_50k_count: 24,
      round_5k_count: 51,
      is_frozen_flag: 0,
      days_since_freeze: null, // Never frozen
      days_since_last_kyc: 29,
      active_lifespan_days: 92,
      peak_month_volume: 5800000,
    },
    timeline: [
      { date: 'Aug 01', volume: 220000, transactionCount: 6, isInSuspiciousWindow: false },
      { date: 'Aug 14', volume: 1420000, transactionCount: 42, isInSuspiciousWindow: true },
      { date: 'Aug 21', volume: 1980000, transactionCount: 56, isInSuspiciousWindow: true },
      { date: 'Aug 28', volume: 2450000, transactionCount: 68, isInSuspiciousWindow: true },
      { date: 'Sep 05', volume: 1850000, transactionCount: 38, isInSuspiciousWindow: true },
      { date: 'Sep 12', volume: 380000, transactionCount: 8, isInSuspiciousWindow: false },
      { date: 'Sep 20', volume: 120000, transactionCount: 4, isInSuspiciousWindow: false },
    ],
    transactions: [
      {
        id: 'TXN-9014-01',
        timestamp: '16 Sep 2026, 15:40 IST',
        sourceAccount: 'ACC-REV-7721',
        targetAccount: 'ACC-MULE-9014',
        amount: 620000,
        direction: 'Inflow',
      },
      {
        id: 'TXN-9014-02',
        timestamp: '17 Sep 2026, 09:15 IST',
        sourceAccount: 'ACC-MULE-7842',
        targetAccount: 'ACC-MULE-9014',
        amount: 1250000,
        direction: 'Inflow',
      },
      {
        id: 'TXN-9014-03',
        timestamp: '18 Sep 2026, 13:10 IST',
        sourceAccount: 'ACC-MULE-9014',
        targetAccount: 'ACC-REV-6619',
        amount: 420000,
        direction: 'Outflow',
      },
      {
        id: 'TXN-9014-04',
        timestamp: '20 Sep 2026, 14:18 IST',
        sourceAccount: 'ACC-MULE-9014',
        targetAccount: 'ACC-RET-2190',
        amount: 75000,
        direction: 'Outflow',
      },
    ],
  },
  'ACC-REV-4309': {
    accountId: 'ACC-REV-4309',
    predictionStatus: 'Mule',
    riskScore: 75.39,
    riskLevel: 'Medium',
    accountStatus: 'Active',
    branchCode: 'BR-0955-CHE',
    panNumber: 'KLMNO9012P',
    totalTransactions: 52,
    totalVolume: 1450000,
    totalCreditVolume: 820000,
    totalDebitVolume: 630000,
    uniqueCounterparties: 18,
    suspiciousStart: '2026-09-12',
    suspiciousEnd: '2026-10-08',
    activityDurationDays: 26,
    features: {
      total_unique_cp: 18,
      pass_through_symmetry: 0.45,
      structuring_50k_count: 5,
      round_5k_count: 14,
      is_frozen_flag: 0,
      days_since_freeze: null,
      days_since_last_kyc: 9, // Very recent KYC edit
      active_lifespan_days: 140,
      peak_month_volume: 1100000,
    },
    timeline: [
      { date: 'Aug 20', volume: 60000, transactionCount: 2, isInSuspiciousWindow: false },
      { date: 'Sep 01', volume: 80000, transactionCount: 3, isInSuspiciousWindow: false },
      { date: 'Sep 12', volume: 420000, transactionCount: 16, isInSuspiciousWindow: true },
      { date: 'Sep 22', volume: 510000, transactionCount: 19, isInSuspiciousWindow: true },
      { date: 'Oct 02', volume: 320000, transactionCount: 10, isInSuspiciousWindow: true },
      { date: 'Oct 15', volume: 60000, transactionCount: 2, isInSuspiciousWindow: false },
    ],
    transactions: [
      {
        id: 'TXN-4309-01',
        timestamp: '15 Sep 2026, 10:20 IST',
        sourceAccount: 'ACC-REV-4309',
        targetAccount: 'ACC-MULE-7842',
        amount: 250000,
        direction: 'Outflow',
      },
    ],
  },
  'ACC-RET-5501': {
    accountId: 'ACC-RET-5501',
    predictionStatus: 'Non-Mule',
    riskScore: 12.30,
    riskLevel: 'Low',
    accountStatus: 'Active',
    branchCode: 'BR-0654-BHO',
    panNumber: 'PQRST3456Q',
    totalTransactions: 14,
    totalVolume: 180000,
    totalCreditVolume: 110000,
    totalDebitVolume: 70000,
    uniqueCounterparties: 4,
    suspiciousStart: null,
    suspiciousEnd: null,
    activityDurationDays: null,
    features: {
      total_unique_cp: 4,
      pass_through_symmetry: 0.82, // Standard retail savings pattern
      structuring_50k_count: 0,
      round_5k_count: 2,
      is_frozen_flag: 0,
      days_since_freeze: null,
      days_since_last_kyc: 410, // Well-established identity
      active_lifespan_days: 620,
      peak_month_volume: 75000,
    },
    timeline: [
      { date: 'Jul 15', volume: 35000, transactionCount: 3, isInSuspiciousWindow: false },
      { date: 'Aug 15', volume: 45000, transactionCount: 4, isInSuspiciousWindow: false },
      { date: 'Sep 15', volume: 55000, transactionCount: 4, isInSuspiciousWindow: false },
      { date: 'Oct 15', volume: 45000, transactionCount: 3, isInSuspiciousWindow: false },
    ],
    transactions: [
      {
        id: 'TXN-5501-01',
        timestamp: '14 Sep 2026, 09:12 IST',
        sourceAccount: 'ACC-RET-5501',
        targetAccount: 'ACC-MULE-5192',
        amount: 49000,
        direction: 'Outflow',
      },
    ],
  },
};

// -------------------------------------------------------------
// Lookup Function: Retrieve or Synthesize Account Record
// -------------------------------------------------------------
export function getAccountInvestigationData(accountId?: string | null): AccountInvestigationData | null {
  if (!accountId || !accountId.trim()) return null;

  const normalized = accountId.trim();

  // 1. Direct match in detailed profiles
  if (DETAILED_INVESTIGATION_ACCOUNTS[normalized]) {
    return DETAILED_INVESTIGATION_ACCOUNTS[normalized];
  }

  // 2. Synthesize baseline record if account is from network or suspicious list
  const isMule = normalized.includes('MULE');
  const isRev = normalized.includes('REV');
  const riskLevel: RiskLevel = isMule ? 'High' : isRev ? 'Medium' : 'Low';
  const predictionStatus = isMule ? 'Mule' : 'Non-Mule';
  const riskScore = isMule ? 94.5 : isRev ? 68.4 : 15.2;

  // Extract edges where this account is source or target
  const relevantEdges = INITIAL_GRAPH_EDGES.filter(
    (e) => e.source === normalized || e.target === normalized
  );

  const txns: AccountTransactionRecord[] = relevantEdges.map((e, idx) => ({
    id: `TXN-${normalized}-${idx + 1}`,
    timestamp: e.data.timestamp,
    sourceAccount: e.source,
    targetAccount: e.target,
    amount: e.data.amount,
    direction: e.target === normalized ? 'Inflow' : 'Outflow',
  }));

  const totalCredits = txns
    .filter((t) => t.direction === 'Inflow')
    .reduce((sum, t) => sum + t.amount, 0) || (isMule ? 2500000 : 350000);

  const totalDebits = txns
    .filter((t) => t.direction === 'Outflow')
    .reduce((sum, t) => sum + t.amount, 0) || (isMule ? 2400000 : 250000);

  return {
    accountId: normalized,
    predictionStatus,
    riskScore,
    riskLevel,
    accountStatus: isMule ? 'Frozen' : 'Active',
    branchCode: 'BR-0100-MUM',
    panNumber: 'ABCDE9999Z',
    totalTransactions: Math.max(txns.length, isMule ? 84 : 18),
    totalVolume: totalCredits + totalDebits,
    totalCreditVolume: totalCredits,
    totalDebitVolume: totalDebits,
    uniqueCounterparties: isMule ? 34 : 8,
    suspiciousStart: isMule || isRev ? '2026-09-05' : null,
    suspiciousEnd: isMule || isRev ? '2026-09-30' : null,
    activityDurationDays: isMule || isRev ? 25 : null,
    features: {
      total_unique_cp: isMule ? 34 : 8,
      pass_through_symmetry: isMule ? 0.18 : 0.75,
      structuring_50k_count: isMule ? 9 : 0,
      round_5k_count: isMule ? 21 : 3,
      is_frozen_flag: isMule ? 1 : 0,
      days_since_freeze: isMule ? 30 : null,
      days_since_last_kyc: isMule ? 25 : 210,
      active_lifespan_days: isMule ? 78 : 340,
      peak_month_volume: isMule ? 3200000 : 210000,
    },
    timeline: [
      { date: 'Aug 15', volume: isMule ? 240000 : 40000, transactionCount: 4, isInSuspiciousWindow: false },
      { date: 'Sep 05', volume: isMule ? 1120000 : 95000, transactionCount: 18, isInSuspiciousWindow: true },
      { date: 'Sep 18', volume: isMule ? 1850000 : 110000, transactionCount: 28, isInSuspiciousWindow: true },
      { date: 'Sep 30', volume: isMule ? 480000 : 50000, transactionCount: 8, isInSuspiciousWindow: true },
      { date: 'Oct 15', volume: isMule ? 120000 : 35000, transactionCount: 2, isInSuspiciousWindow: false },
    ],
    transactions: txns,
  };
}
