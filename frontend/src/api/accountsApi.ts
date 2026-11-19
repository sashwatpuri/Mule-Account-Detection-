/**
 * Suspicious Accounts API Service
 *
 * Prepares functions for:
 * - Querying suspicious accounts queue with search, risk filter, and pagination
 * - Mapping raw backend feature vectors (snake_case) to UI domain items
 * 
 * NOTE ON PROBABILITIES (RULE 9):
 * `is_mule` is a binary classification label (0 = Legitimate, 1 = Mule).
 * It is NEVER converted into a probability percentage.
 * Risk probabilities are only displayed if the backend explicitly returns `mule_probability`.
 */

import { ApiClient, ApiClientResult } from './apiClient';
import { API_CONFIG } from '@/config/apiConfig';
import { BackendAccountFeatures, PaginatedApiResponse } from '@/types/amlBackend';
import {
  MOCK_SUSPICIOUS_ACCOUNTS,
  SuspiciousAccountItem,
  SuspiciousAccountsFilterState,
} from '@/mock/suspiciousAccountsData';

export interface AccountsQueryResult {
  accounts: SuspiciousAccountItem[];
  totalFlaggedCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  isLiveBackend: boolean;
}

export class AccountsApi {
  /**
   * Safe adapter: converts raw backend feature dictionary to SuspiciousAccountItem
   */
  public static mapBackendToItem(raw: BackendAccountFeatures): SuspiciousAccountItem {
    const isMule = raw.is_mule === 1;

    // RULE 9: Display actual probability only if provided by backend predict_proba()
    // Otherwise calculate a discrete risk tier based on binary prediction & counterparty flags
    const hasProbability = typeof raw.mule_probability === 'number';
    const riskScore = hasProbability ? (raw.mule_probability as number) : isMule ? 95.0 : 10.0;

    let riskLevel: 'High' | 'Medium' | 'Low' = 'Low';
    if (isMule || (hasProbability && (raw.mule_probability ?? 0) >= 75)) {
      riskLevel = 'High';
    } else if ((raw.mule_probability ?? 0) >= 50 || (raw.total_unique_cp ?? 0) > 20) {
      riskLevel = 'Medium';
    }

    return {
      accountId: raw.account_id,
      riskScore,
      riskLevel,
      totalTransactions: raw.total_txns ?? 0,
      totalVolume: raw.total_volume ?? 0,
      uniqueCounterparties: raw.total_unique_cp ?? 0,
      suspiciousStart: raw.suspicious_start ?? '',
      suspiciousEnd: raw.suspicious_end ?? '',
      primaryTrigger:
        (raw.total_unique_cp ?? 0) > 30.5
          ? 'Counterparty Funnel (CP > 30.5)'
          : (raw.pass_through_symmetry ?? 1) <= 0.33
          ? 'Pass-Through Symmetry \u2264 0.33'
          : (raw.days_since_last_kyc ?? 999) <= 41.5
          ? 'Recent KYC Update \u2264 41.5d'
          : 'Decision Split Flag',
      isFrozen: raw.is_frozen_flag === 1,
      daysSinceLastKyc: raw.days_since_last_kyc ?? 999,
      branchCode: 'BR-DEFAULT',
    };
  }

  /**
   * Helper: applies filters to accounts when running in offline development mode
   */
  private static filterAccountsLocally(
    list: SuspiciousAccountItem[],
    filters?: Partial<SuspiciousAccountsFilterState>
  ): SuspiciousAccountItem[] {
    if (!filters) return list;
    return list.filter((acc) => {
      if (filters.searchQuery?.trim()) {
        const query = filters.searchQuery.trim().toLowerCase();
        if (!acc.accountId.toLowerCase().includes(query)) return false;
      }
      if (filters.riskLevel && filters.riskLevel !== 'all') {
        if (acc.riskLevel.toLowerCase() !== filters.riskLevel.toLowerCase()) return false;
      }
      if (filters.riskScoreRange && filters.riskScoreRange !== 'all') {
        if (filters.riskScoreRange === '0-50' && (acc.riskScore < 0 || acc.riskScore > 50)) return false;
        if (filters.riskScoreRange === '50-75' && (acc.riskScore <= 50 || acc.riskScore > 75)) return false;
        if (filters.riskScoreRange === '75-100' && (acc.riskScore <= 75 || acc.riskScore > 100)) return false;
      }
      if (filters.volumeRange && filters.volumeRange !== 'all') {
        if (filters.volumeRange === 'low' && acc.totalVolume >= 1000000) return false;
        if (filters.volumeRange === 'medium' && (acc.totalVolume < 1000000 || acc.totalVolume > 5000000)) return false;
        if (filters.volumeRange === 'high' && acc.totalVolume <= 5000000) return false;
      }
      return true;
    });
  }

  /**
   * Fetch suspicious accounts triage queue
   */
  public static async getSuspiciousAccounts(
    filters?: Partial<SuspiciousAccountsFilterState>,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiClientResult<AccountsQueryResult>> {
    if (!API_CONFIG.isConfigured()) {
      const filtered = AccountsApi.filterAccountsLocally(MOCK_SUSPICIOUS_ACCOUNTS, filters);
      return {
        success: true,
        data: {
          accounts: filtered,
          totalFlaggedCount: filtered.length,
          highRiskCount: filtered.filter((a) => a.riskLevel === 'High').length,
          mediumRiskCount: filtered.filter((a) => a.riskLevel === 'Medium').length,
          isLiveBackend: false,
        },
        error: null,
        isMockFallback: true,
      };
    }

    const res = await ApiClient.get<PaginatedApiResponse<BackendAccountFeatures>>(
      API_CONFIG.ENDPOINTS.SUSPICIOUS_ACCOUNTS,
      {
        page,
        limit,
        search: filters?.searchQuery,
        risk_level: filters?.riskLevel !== 'all' ? filters?.riskLevel : undefined,
        score_range: filters?.riskScoreRange !== 'all' ? filters?.riskScoreRange : undefined,
        volume_range: filters?.volumeRange !== 'all' ? filters?.volumeRange : undefined,
      }
    );

    if (res.success && res.data) {
      const mapped = res.data.items.map(AccountsApi.mapBackendToItem);
      return {
        success: true,
        data: {
          accounts: mapped,
          totalFlaggedCount: res.data.total,
          highRiskCount: mapped.filter((a) => a.riskLevel === 'High').length,
          mediumRiskCount: mapped.filter((a) => a.riskLevel === 'Medium').length,
          isLiveBackend: true,
        },
        error: null,
      };
    }

    // Fallback on network failure
    const filteredFallback = AccountsApi.filterAccountsLocally(MOCK_SUSPICIOUS_ACCOUNTS, filters);
    return {
      success: true,
      data: {
        accounts: filteredFallback,
        totalFlaggedCount: filteredFallback.length,
        highRiskCount: filteredFallback.filter((a) => a.riskLevel === 'High').length,
        mediumRiskCount: filteredFallback.filter((a) => a.riskLevel === 'Medium').length,
        isLiveBackend: false,
      },
      error: res.error,
      isMockFallback: true,
    };
  }
}
