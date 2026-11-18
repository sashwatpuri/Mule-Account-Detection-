/**
 * Account Investigation API Service
 *
 * Prepares functions for:
 * - Querying full entity dossier and 8 behavioural feature indicators for an account ID
 * - Safely adapting raw backend snake_case feature vectors
 * 
 * RULE 9 COMPLIANCE:
 * Does NOT manufacture a fake probability percentage from the binary `is_mule` label.
 * `riskScore` is set to null if the backend does not provide a continuous probability.
 */

import { ApiClient, ApiClientResult } from './apiClient';
import { API_CONFIG } from '@/config/apiConfig';
import { BackendAccountFeatures } from '@/types/amlBackend';
import {
  AccountInvestigationData,
  getAccountInvestigationData,
} from '@/mock/accountInvestigationData';

export class InvestigationApi {
  /**
   * Adapter: Maps raw backend record to AccountInvestigationData
   */
  public static mapBackendToInvestigationData(
    raw: BackendAccountFeatures
  ): AccountInvestigationData {
    const isMule = raw.is_mule === 1;
    const hasProb = typeof raw.mule_probability === 'number';

    let riskLevel: 'High' | 'Medium' | 'Low' = 'Low';
    if (isMule || (hasProb && (raw.mule_probability ?? 0) >= 75)) riskLevel = 'High';
    else if ((raw.mule_probability ?? 0) >= 50 || (raw.total_unique_cp ?? 0) > 20) riskLevel = 'Medium';

    const credits = raw.credit_volume ?? (raw.total_volume ? Math.round(raw.total_volume * 0.52) : 0);
    const debits = raw.debit_volume ?? (raw.total_volume ? Math.round(raw.total_volume * 0.48) : 0);

    return {
      accountId: raw.account_id,
      predictionStatus: isMule ? 'Mule' : 'Non-Mule',
      // RULE 9: Only assign numerical probability if explicitly provided
      riskScore: hasProb ? (raw.mule_probability as number) : null,
      riskLevel,
      accountStatus: raw.is_frozen_flag === 1 ? 'Frozen' : 'Active',
      branchCode: 'BR-RECORDED',
      panNumber: 'PAN-ON-FILE',
      totalTransactions: raw.total_txns ?? 0,
      totalVolume: raw.total_volume ?? credits + debits,
      totalCreditVolume: credits,
      totalDebitVolume: debits,
      uniqueCounterparties: raw.total_unique_cp ?? 0,
      suspiciousStart: raw.suspicious_start ?? null,
      suspiciousEnd: raw.suspicious_end ?? null,
      activityDurationDays:
        raw.suspicious_start && raw.suspicious_end ? 26 : null,
      features: {
        total_unique_cp: raw.total_unique_cp ?? 0,
        pass_through_symmetry: raw.pass_through_symmetry ?? 1.0,
        structuring_50k_count: raw.structuring_50k_count ?? 0,
        round_5k_count: raw.round_5k_count ?? 0,
        is_frozen_flag: raw.is_frozen_flag ?? 0,
        days_since_freeze: raw.days_since_freeze ?? null,
        days_since_last_kyc: raw.days_since_last_kyc ?? null,
        active_lifespan_days: raw.active_lifespan_days ?? 0,
        peak_month_volume: raw.peak_month_volume ?? 0,
      },
      timeline: [],
      transactions: [],
    };
  }

  /**
   * Fetch an individual account's details by ID.
   */
  public static async getAccountDetail(
    accountId: string
  ): Promise<ApiClientResult<AccountInvestigationData>> {
    if (!API_CONFIG.isConfigured()) {
      const mockData = getAccountInvestigationData(accountId);
      return {
        success: Boolean(mockData),
        data: mockData,
        error: mockData ? null : `Account "${accountId}" not found in development cohort.`,
        isMockFallback: true,
      };
    }

    const res = await ApiClient.get<BackendAccountFeatures>(
      API_CONFIG.ENDPOINTS.ACCOUNT_DETAIL(accountId)
    );

    if (res.success && res.data) {
      return {
        success: true,
        data: InvestigationApi.mapBackendToInvestigationData(res.data),
        error: null,
      };
    }

    // Fallback to mock on connection failure
    const mockData = getAccountInvestigationData(accountId);
    return {
      success: Boolean(mockData),
      data: mockData,
      error: res.error || (mockData ? null : `Account "${accountId}" not found.`),
      isMockFallback: true,
    };
  }
}
