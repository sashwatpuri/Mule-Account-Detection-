/**
 * Network Analysis & Transaction Ledger API Service
 *
 * REQUIRED TRANSACTION-LEVEL FIELDS (TASK 8):
 * Reconstructing financial counterparty graphs requires raw transaction records with:
 * 1. `source_account_id`: Originator account identifier
 * 2. `destination_account_id`: Recipient account identifier
 * 3. `transaction_amount`: Monetary value in INR (₹)
 * 4. `timestamp`: Exact transaction execution timestamp
 *
 * NOTE ON DATA REQUIREMENTS:
 * The existing feature extraction pipeline calculates unique counterparty counts (`total_unique_cp`),
 * but aggregated features alone CANNOT reconstruct directed transaction paths.
 * Real transaction-level records from the transaction database are required for production integration.
 */

import { ApiClient, ApiClientResult } from './apiClient';
import { API_CONFIG } from '@/config/apiConfig';
import { BackendNetworkTopologyResponse } from '@/types/amlBackend';
import {
  INITIAL_GRAPH_NODES,
  INITIAL_GRAPH_EDGES,
  GraphNodeDefinition,
  GraphEdgeDefinition,
} from '@/mock/networkGraphData';

export interface NetworkTopologyPayload {
  nodes: GraphNodeDefinition[];
  edges: GraphEdgeDefinition[];
  isLiveBackend: boolean;
}

export class NetworkApi {
  /**
   * Fetch transaction-level records and construct network topology for an account.
   */
  public static async getNetworkTopology(
    accountId: string = 'ACCT_000038'
  ): Promise<ApiClientResult<NetworkTopologyPayload>> {
    if (!API_CONFIG.isConfigured()) {
      return {
        success: true,
        data: {
          nodes: INITIAL_GRAPH_NODES,
          edges: INITIAL_GRAPH_EDGES,
          isLiveBackend: false,
        },
        error: null,
        isMockFallback: true,
      };
    }

    const res = await ApiClient.get<BackendNetworkTopologyResponse>(
      API_CONFIG.ENDPOINTS.NETWORK_TOPOLOGY(accountId)
    );

    if (res.success && res.data) {
      // Map backend accounts & transactions to React Flow nodes & edges
      const nodes: GraphNodeDefinition[] = res.data.accounts.map((acc, idx) => ({
        id: acc.account_id,
        type: 'accountNode',
        position: { x: (idx % 4) * 280 + 50, y: Math.floor(idx / 4) * 160 + 80 },
        data: {
          accountId: acc.account_id,
          riskLevel: acc.is_mule === 1 ? 'High' : (acc.total_unique_cp ?? 0) > 20 ? 'Medium' : 'Low',
          predictionStatus: acc.is_mule === 1 ? 'Mule Account' : 'Legitimate Account',
          totalTransactions: acc.total_txns ?? 0,
          totalVolume: acc.total_volume ?? 0,
          uniqueCounterparties: acc.total_unique_cp ?? 0,
          isCentralHub: acc.account_id === res.data?.root_account_id,
        },
      }));

      const edges: GraphEdgeDefinition[] = res.data.transactions.map((txn, idx) => ({
        id: `e-${txn.source_account_id}-${txn.destination_account_id}-${idx}`,
        source: txn.source_account_id,
        target: txn.destination_account_id,
        data: {
          amount: txn.transaction_amount,
          timestamp: txn.timestamp,
          sourceAccount: txn.source_account_id,
          targetAccount: txn.destination_account_id,
        },
      }));

      return {
        success: true,
        data: {
          nodes,
          edges,
          isLiveBackend: true,
        },
        error: null,
      };
    }

    // Fallback on connection failure
    return {
      success: true,
      data: {
        nodes: INITIAL_GRAPH_NODES,
        edges: INITIAL_GRAPH_EDGES,
        isLiveBackend: false,
      },
      error: res.error,
      isMockFallback: true,
    };
  }
}
