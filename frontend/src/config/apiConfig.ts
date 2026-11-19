/**
 * Central API Configuration
 *
 * Reads base URL from environment variable VITE_API_BASE_URL.
 * If unset or empty, the frontend runs in offline development mode using
 * clearly marked illustrative development mock data.
 */

export const API_CONFIG = {
  // Central base URL configured via .env
  BASE_URL: (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''),

  // Default request timeout in milliseconds
  TIMEOUT_MS: 10000,

  // Feature flag: whether an external backend base URL has been specified
  isConfigured(): boolean {
    return Boolean(this.BASE_URL && this.BASE_URL.trim() !== '');
  },

  // API Endpoints Contract (mapped to backend controllers)
  ENDPOINTS: {
    // Dashboard & Model overview metrics
    DASHBOARD_METRICS: '/metrics/overview',

    // Suspicious accounts queue (supports ?page=&limit=&search=&risk_level=)
    SUSPICIOUS_ACCOUNTS: '/accounts/suspicious',

    // Individual account feature vector & IoU window (/accounts/:id)
    ACCOUNT_DETAIL: (accountId: string) => `/accounts/${encodeURIComponent(accountId)}`,

    // Transaction-level network edges & nodes for graph (/network/:id)
    NETWORK_TOPOLOGY: (accountId: string) => `/network/${encodeURIComponent(accountId)}`,
  },
} as const;
