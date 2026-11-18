/**
 * Network Analysis Graph Mock Dataset & Types
 *
 * NOTE: Illustrative graph dataset representing financial connections between accounts.
 * Notice: Aggregated feature extraction calculates counterparty statistics, but 
 * transaction-level data from the database/backend will populate these exact node-edge pairs.
 */

export type RiskLevel = 'High' | 'Medium' | 'Low';

export interface AccountNodePayload extends Record<string, unknown> {
  accountId: string;
  riskLevel: RiskLevel;
  predictionStatus: string;
  totalTransactions: number;
  totalVolume: number; // in INR (\u20B9)
  uniqueCounterparties: number;
  isCentralHub?: boolean;
}

export interface TransactionEdgePayload extends Record<string, unknown> {
  amount: number; // in INR (\u20B9)
  timestamp: string;
  sourceAccount: string;
  targetAccount: string;
}

export interface GraphNodeDefinition {
  id: string;
  type: 'accountNode';
  position: { x: number; y: number };
  data: AccountNodePayload;
}

export interface GraphEdgeDefinition {
  id: string;
  source: string;
  target: string;
  data: TransactionEdgePayload;
}

// -------------------------------------------------------------
// 12 Representative Illustrative Account Nodes
// Laid out in a logical left-to-right Directed Flow
// -------------------------------------------------------------
export const INITIAL_GRAPH_NODES: GraphNodeDefinition[] = [
  // Tier 1: Inflow / Depositors (Left side)
  {
    id: 'ACC-RET-5501',
    type: 'accountNode',
    position: { x: 50, y: 80 },
    data: {
      accountId: 'ACC-RET-5501',
      riskLevel: 'Low',
      predictionStatus: 'Legitimate (Regular Salary / Retail Flow)',
      totalTransactions: 14,
      totalVolume: 180000,
      uniqueCounterparties: 4,
    },
  },
  {
    id: 'ACC-RET-8812',
    type: 'accountNode',
    position: { x: 50, y: 220 },
    data: {
      accountId: 'ACC-RET-8812',
      riskLevel: 'Low',
      predictionStatus: 'Legitimate (Standard Merchant Interaction)',
      totalTransactions: 19,
      totalVolume: 320000,
      uniqueCounterparties: 6,
    },
  },
  {
    id: 'ACC-REV-4309',
    type: 'accountNode',
    position: { x: 50, y: 360 },
    data: {
      accountId: 'ACC-REV-4309',
      riskLevel: 'Medium',
      predictionStatus: 'Suspicious (Recent KYC Update \u2264 41d)',
      totalTransactions: 52,
      totalVolume: 1450000,
      uniqueCounterparties: 18,
    },
  },
  {
    id: 'ACC-REV-2871',
    type: 'accountNode',
    position: { x: 50, y: 500 },
    data: {
      accountId: 'ACC-REV-2871',
      riskLevel: 'Medium',
      predictionStatus: 'Suspicious (Asymmetric Multi-Party Inflow)',
      totalTransactions: 36,
      totalVolume: 980000,
      uniqueCounterparties: 16,
    },
  },

  // Tier 2: Intermediate Smurfing & Aggregation Nodes
  {
    id: 'ACC-MULE-5192',
    type: 'accountNode',
    position: { x: 340, y: 140 },
    data: {
      accountId: 'ACC-MULE-5192',
      riskLevel: 'High',
      predictionStatus: 'Mule Account (Structuring \u20B945k-\u20B950k clusters)',
      totalTransactions: 76,
      totalVolume: 3950000,
      uniqueCounterparties: 32,
    },
  },
  {
    id: 'ACC-REV-7721',
    type: 'accountNode',
    position: { x: 340, y: 440 },
    data: {
      accountId: 'ACC-REV-7721',
      riskLevel: 'Medium',
      predictionStatus: 'Suspicious (Sudden Inflow Symmetry Surge)',
      totalTransactions: 48,
      totalVolume: 1820000,
      uniqueCounterparties: 22,
    },
  },

  // Tier 3: Core Central High-Risk Mule Funnel Hubs (Center)
  {
    id: 'ACC-MULE-7842',
    type: 'accountNode',
    position: { x: 620, y: 240 },
    data: {
      accountId: 'ACC-MULE-7842',
      riskLevel: 'High',
      predictionStatus: 'Mule Account (Leaf 10: Pure Pass-Through Hub)',
      totalTransactions: 148,
      totalVolume: 4850000,
      uniqueCounterparties: 42,
      isCentralHub: true,
    },
  },
  {
    id: 'ACC-MULE-9014',
    type: 'accountNode',
    position: { x: 620, y: 460 },
    data: {
      accountId: 'ACC-MULE-9014',
      riskLevel: 'High',
      predictionStatus: 'Mule Account (Leaf 11: Aggregated Fan-Out)',
      totalTransactions: 215,
      totalVolume: 8420000,
      uniqueCounterparties: 56,
      isCentralHub: true,
    },
  },

  // Tier 4: Layering & Disbursement Relays
  {
    id: 'ACC-MULE-3341',
    type: 'accountNode',
    position: { x: 920, y: 160 },
    data: {
      accountId: 'ACC-MULE-3341',
      riskLevel: 'High',
      predictionStatus: 'Mule Account (Rapid Velocity Window)',
      totalTransactions: 64,
      totalVolume: 2450000,
      uniqueCounterparties: 31,
    },
  },
  {
    id: 'ACC-REV-6619',
    type: 'accountNode',
    position: { x: 920, y: 380 },
    data: {
      accountId: 'ACC-REV-6619',
      riskLevel: 'Medium',
      predictionStatus: 'Suspicious (Consecutive Round-Sum Credits)',
      totalTransactions: 41,
      totalVolume: 840000,
      uniqueCounterparties: 14,
    },
  },

  // Tier 5: Terminal Outflow & Frozen Nodes (Right side)
  {
    id: 'ACC-MULE-6112',
    type: 'accountNode',
    position: { x: 1200, y: 180 },
    data: {
      accountId: 'ACC-MULE-6112',
      riskLevel: 'High',
      predictionStatus: 'Mule Account (Recent AML Freeze \u2264 360d)',
      totalTransactions: 114,
      totalVolume: 6180000,
      uniqueCounterparties: 38,
    },
  },
  {
    id: 'ACC-RET-9943',
    type: 'accountNode',
    position: { x: 1200, y: 340 },
    data: {
      accountId: 'ACC-RET-9943',
      riskLevel: 'Low',
      predictionStatus: 'Legitimate (Merchant Terminal Recipient)',
      totalTransactions: 22,
      totalVolume: 490000,
      uniqueCounterparties: 8,
    },
  },
  {
    id: 'ACC-RET-2190',
    type: 'accountNode',
    position: { x: 1200, y: 480 },
    data: {
      accountId: 'ACC-RET-2190',
      riskLevel: 'Low',
      predictionStatus: 'Legitimate (Clean Account)',
      totalTransactions: 9,
      totalVolume: 95000,
      uniqueCounterparties: 3,
    },
  },
];

// -------------------------------------------------------------
// Illustrative Directed Transaction Edges
// (Money movement arrows with realistic amounts and timestamps)
// -------------------------------------------------------------
export const INITIAL_GRAPH_EDGES: GraphEdgeDefinition[] = [
  // Inflow to Intermediate / Hubs
  {
    id: 'e-5501-5192',
    source: 'ACC-RET-5501',
    target: 'ACC-MULE-5192',
    data: {
      amount: 49000,
      timestamp: '14 Sep 2026, 09:12 IST',
      sourceAccount: 'ACC-RET-5501',
      targetAccount: 'ACC-MULE-5192',
    },
  },
  {
    id: 'e-8812-5192',
    source: 'ACC-RET-8812',
    target: 'ACC-MULE-5192',
    data: {
      amount: 48500,
      timestamp: '14 Sep 2026, 11:45 IST',
      sourceAccount: 'ACC-RET-8812',
      targetAccount: 'ACC-MULE-5192',
    },
  },
  {
    id: 'e-4309-7842',
    source: 'ACC-REV-4309',
    target: 'ACC-MULE-7842',
    data: {
      amount: 250000,
      timestamp: '15 Sep 2026, 10:20 IST',
      sourceAccount: 'ACC-REV-4309',
      targetAccount: 'ACC-MULE-7842',
    },
  },
  {
    id: 'e-2871-7721',
    source: 'ACC-REV-2871',
    target: 'ACC-REV-7721',
    data: {
      amount: 175000,
      timestamp: '15 Sep 2026, 14:05 IST',
      sourceAccount: 'ACC-REV-2871',
      targetAccount: 'ACC-REV-7721',
    },
  },
  {
    id: 'e-5192-7842',
    source: 'ACC-MULE-5192',
    target: 'ACC-MULE-7842',
    data: {
      amount: 980000,
      timestamp: '16 Sep 2026, 12:30 IST',
      sourceAccount: 'ACC-MULE-5192',
      targetAccount: 'ACC-MULE-7842',
    },
  },
  {
    id: 'e-7721-9014',
    source: 'ACC-REV-7721',
    target: 'ACC-MULE-9014',
    data: {
      amount: 620000,
      timestamp: '16 Sep 2026, 15:40 IST',
      sourceAccount: 'ACC-REV-7721',
      targetAccount: 'ACC-MULE-9014',
    },
  },

  // Inter-Hub Transfer (Pass-Through Tunneling)
  {
    id: 'e-7842-9014',
    source: 'ACC-MULE-7842',
    target: 'ACC-MULE-9014',
    data: {
      amount: 1250000,
      timestamp: '17 Sep 2026, 09:15 IST',
      sourceAccount: 'ACC-MULE-7842',
      targetAccount: 'ACC-MULE-9014',
    },
  },

  // Fan-Out Outflows from Central Hubs
  {
    id: 'e-7842-3341',
    source: 'ACC-MULE-7842',
    target: 'ACC-MULE-3341',
    data: {
      amount: 850000,
      timestamp: '17 Sep 2026, 11:50 IST',
      sourceAccount: 'ACC-MULE-7842',
      targetAccount: 'ACC-MULE-3341',
    },
  },
  {
    id: 'e-9014-6619',
    source: 'ACC-MULE-9014',
    target: 'ACC-REV-6619',
    data: {
      amount: 420000,
      timestamp: '18 Sep 2026, 13:10 IST',
      sourceAccount: 'ACC-MULE-9014',
      targetAccount: 'ACC-REV-6619',
    },
  },
  {
    id: 'e-3341-6112',
    source: 'ACC-MULE-3341',
    target: 'ACC-MULE-6112',
    data: {
      amount: 1100000,
      timestamp: '19 Sep 2026, 16:22 IST',
      sourceAccount: 'ACC-MULE-3341',
      targetAccount: 'ACC-MULE-6112',
    },
  },
  {
    id: 'e-6619-9943',
    source: 'ACC-REV-6619',
    target: 'ACC-RET-9943',
    data: {
      amount: 125000,
      timestamp: '20 Sep 2026, 10:45 IST',
      sourceAccount: 'ACC-REV-6619',
      targetAccount: 'ACC-RET-9943',
    },
  },
  {
    id: 'e-9014-2190',
    source: 'ACC-MULE-9014',
    target: 'ACC-RET-2190',
    data: {
      amount: 75000,
      timestamp: '20 Sep 2026, 14:18 IST',
      sourceAccount: 'ACC-MULE-9014',
      targetAccount: 'ACC-RET-2190',
    },
  },
];
