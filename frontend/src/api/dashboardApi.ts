/**
 * Dashboard & Model Metrics API Service
 *
 * Prepares functions for:
 * - Fetching overview KPI statistics (total analysed, suspicious count, clearance rate)
 * - Fetching trained Decision Tree evaluation results & feature importances
 */

import { ApiClient, ApiClientResult } from './apiClient';
import { API_CONFIG } from '@/config/apiConfig';
import { BackendDecisionTreeResults } from '@/types/amlBackend';
import {
  MOCK_OVERVIEW_STATS,
  MOCK_RISK_DISTRIBUTION,
  MOCK_VOLUME_COMPARISON,
  MOCK_FEATURE_IMPORTANCE,
  MOCK_ACCOUNT_RISK_DISTRIBUTION,
  StatMetric,
  RiskCategory,
  VolumeComparison,
  FeatureImportanceItem,
  RiskScoreBucket,
} from '@/mock/overviewData';

export interface DashboardOverviewPayload {
  stats: StatMetric[];
  riskDistribution: RiskCategory[];
  volumeComparison: VolumeComparison[];
  featureImportance: FeatureImportanceItem[];
  accountRiskDistribution: RiskScoreBucket[];
  isLiveBackend: boolean;
}

export class DashboardApi {
  /**
   * Fetch aggregate dashboard overview data.
   * If backend is not available, returns illustrative development mock data
   * clearly flagged with isLiveBackend: false.
   */
  public static async getOverviewData(): Promise<ApiClientResult<DashboardOverviewPayload>> {
    if (!API_CONFIG.isConfigured()) {
      return {
        success: true,
        data: {
          stats: MOCK_OVERVIEW_STATS,
          riskDistribution: MOCK_RISK_DISTRIBUTION,
          volumeComparison: MOCK_VOLUME_COMPARISON,
          featureImportance: MOCK_FEATURE_IMPORTANCE,
          accountRiskDistribution: MOCK_ACCOUNT_RISK_DISTRIBUTION,
          isLiveBackend: false,
        },
        error: null,
        isMockFallback: true,
      };
    }

    const res = await ApiClient.get<DashboardOverviewPayload>(API_CONFIG.ENDPOINTS.DASHBOARD_METRICS);

    if (res.success && res.data) {
      return {
        ...res,
        data: {
          ...res.data,
          isLiveBackend: true,
        },
      };
    }

    // Fallback to development mock data on network error, preserving error message
    return {
      success: true,
      data: {
        stats: MOCK_OVERVIEW_STATS,
        riskDistribution: MOCK_RISK_DISTRIBUTION,
        volumeComparison: MOCK_VOLUME_COMPARISON,
        featureImportance: MOCK_FEATURE_IMPORTANCE,
        accountRiskDistribution: MOCK_ACCOUNT_RISK_DISTRIBUTION,
        isLiveBackend: false,
      },
      error: res.error,
      isMockFallback: true,
    };
  }

  /**
   * Fetch Decision Tree Model Evaluation metrics matching outputs/full_decision_tree_results.json
   */
  public static async getModelResults(): Promise<ApiClientResult<BackendDecisionTreeResults>> {
    return ApiClient.get<BackendDecisionTreeResults>('/models/decision-tree');
  }
}
