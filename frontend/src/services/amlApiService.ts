/**
 * AML Mule Account Detection Frontend API Service
 *
 * ARCHITECTURAL CONTRACT:
 * This service defines the boundary between the frontend UI and the future backend REST/FastAPI service.
 * It cleanly adapts backend snake_case feature vectors to the frontend models, gracefully handles
 * missing or undefined fields, and falls back to illustrative mock data when no backend is connected.
 *
 * EXPECTED BACKEND ENDPOINTS (FastAPI service in backend/main.py):
 * - GET  /api/v1/metrics/overview     -> Returns real 96k-account stats, risk distribution, feature importances
 * - GET  /api/v1/metrics/baseline     -> Backward-compat alias for /metrics/overview
 * - GET  /api/v1/accounts/suspicious  -> Returns paginated flagged accounts with query/filter params
 * - GET  /api/v1/accounts/:id         -> Returns single account feature vector and IoU window
 * - GET  /api/v1/network/:id          -> Returns 1st and 2nd degree counterparty graph nodes & edges
 */

import { RawBackendAccountRecord } from '@/types/backend';
import {
  MOCK_OVERVIEW_STATS,
  MOCK_RISK_DISTRIBUTION,
  MOCK_VOLUME_COMPARISON,
  MOCK_FEATURE_IMPORTANCE,
  MOCK_ACCOUNT_RISK_DISTRIBUTION,
} from '@/mock/overviewData';
import {
  MOCK_SUSPICIOUS_ACCOUNTS,
  MOCK_SUSPICIOUS_SUMMARY,
  SuspiciousAccountItem,
} from '@/mock/suspiciousAccountsData';
import {
  AccountInvestigationData,
  getAccountInvestigationData,
} from '@/mock/accountInvestigationData';
import {
  INITIAL_GRAPH_NODES,
  INITIAL_GRAPH_EDGES,
  GraphNodeDefinition,
  GraphEdgeDefinition,
} from '@/mock/networkGraphData';

export class AmlApiService {
  /**
   * Adapts raw backend feature record (snake_case) to SuspiciousAccountItem (camelCase)
   */
  public static mapBackendToAccountItem(
    raw: RawBackendAccountRecord
  ): SuspiciousAccountItem {
    const isMule = raw.is_mule === 1;
    const probability = raw.mule_probability ?? (isMule ? 95.0 : 15.0);

    let riskLevel: 'High' | 'Medium' | 'Low' = 'Low';
    if (probability >= 75 || isMule) riskLevel = 'High';
    else if (probability >= 50) riskLevel = 'Medium';

    return {
      accountId: raw.account_id,
      riskScore: probability,
      riskLevel,
      totalTransactions: raw.total_txns ?? 0,
      totalVolume: raw.total_volume ?? 0,
      uniqueCounterparties: raw.total_unique_cp ?? 0,
      suspiciousStart: raw.suspicious_start ?? '',
      suspiciousEnd: raw.suspicious_end ?? '',
      primaryTrigger:
        (raw.total_unique_cp ?? 0) > 30.5
          ? 'Counterparties > 30.5 (Fan-In/Out)'
          : (raw.pass_through_symmetry ?? 1) <= 0.33
          ? 'Pass-Through Symmetry \u2264 0.33'
          : 'Elevated Velocity Flag',
      isFrozen: raw.is_frozen_flag === 1,
      daysSinceLastKyc: raw.days_since_last_kyc ?? 999,
      branchCode: 'BR-DEFAULT',
    };
  }

  /**
   * Fetch Overview Dashboard Metrics
   */
  public static async getOverviewDashboardData() {
    // Integration point: return fetch('/api/v1/metrics/baseline').then(r => r.json());
    return {
      stats: MOCK_OVERVIEW_STATS,
      riskDistribution: MOCK_RISK_DISTRIBUTION,
      volumeComparison: MOCK_VOLUME_COMPARISON,
      featureImportance: MOCK_FEATURE_IMPORTANCE,
      accountRiskDistribution: MOCK_ACCOUNT_RISK_DISTRIBUTION,
      isLiveBackend: false,
    };
  }

  /**
   * Fetch Suspicious Accounts Triage Queue
   */
  public static async getSuspiciousAccounts(_params?: {
    searchQuery?: string;
    riskLevel?: string;
    page?: number;
    limit?: number;
  }) {
    // Integration point: return fetch(`/api/v1/accounts/suspicious?${new URLSearchParams(params)}`).then(...)
    return {
      accounts: MOCK_SUSPICIOUS_ACCOUNTS,
      summary: MOCK_SUSPICIOUS_SUMMARY,
      totalCount: MOCK_SUSPICIOUS_ACCOUNTS.length,
      isLiveBackend: false,
    };
  }

  /**
   * Fetch Account Investigation Details
   */
  public static async getAccountDetails(
    accountId: string
  ): Promise<AccountInvestigationData | null> {
    // Integration point: return fetch(`/api/v1/accounts/${encodeURIComponent(accountId)}`).then(...)
    return getAccountInvestigationData(accountId);
  }

  /**
   * Fetch Counterparty Transaction Network
   */
  public static async getNetworkTopology(
    _rootAccountId?: string
  ): Promise<{
    nodes: GraphNodeDefinition[];
    edges: GraphEdgeDefinition[];
    isLiveBackend: boolean;
  }> {
    // Integration point: return fetch(`/api/v1/network/${encodeURIComponent(_rootAccountId)}`).then(...)
    return {
      nodes: INITIAL_GRAPH_NODES,
      edges: INITIAL_GRAPH_EDGES,
      isLiveBackend: false,
    };
  }
}
