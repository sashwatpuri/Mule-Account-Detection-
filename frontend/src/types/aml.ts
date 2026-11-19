/**
 * AML & Mule Account Detection Domain Types
 * Prepared for integration with backend feature extraction and Decision Tree outputs
 */

export type RiskTier = 'high' | 'medium' | 'low';

export interface ModelMetricsSummary {
  modelName: string;
  rocAuc: number;
  prAuc: number;
  f1Score: number;
  precision: number;
  recall: number;
  totalEvaluated: number;
  detectedMules: number;
}

export interface SuspiciousAccountSummary {
  accountId: string;
  riskTier: RiskTier;
  muleProbability: number;
  totalUniqueCounterparties: number;
  passThroughSymmetry: number;
  isFrozen: boolean;
  daysSinceLastKYC: number;
  daysSinceFreeze?: number;
  flaggedReason: string;
  lastActive: string;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: 'target_account' | 'fan_in' | 'fan_out' | 'mule_hub';
  riskTier: RiskTier;
  transactionCount: number;
  totalVolume: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  amount: number;
  timestamp: string;
  isRapidPassThrough: boolean;
}
