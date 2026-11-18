/**
 * Central API Client for Backend Communication
 *
 * Implements fetch with timeout, HTTP error status parsing,
 * and resilient network error capturing without throwing unhandled exceptions.
 */

import { API_CONFIG } from '@/config/apiConfig';

export interface ApiClientResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  statusCode?: number;
  isMockFallback?: boolean;
}

export class ApiClient {
  public static async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiClientResult<T>> {
    if (!API_CONFIG.isConfigured()) {
      return {
        success: false,
        data: null,
        error: 'API base URL is not configured. Running in offline development mode.',
        isMockFallback: true,
      };
    }

    // Build URL with query parameters
    let url = `${API_CONFIG.BASE_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        return {
          success: false,
          data: null,
          statusCode: response.status,
          error: `Backend error HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const json = await response.json();
      return {
        success: true,
        data: json as T,
        error: null,
        statusCode: response.status,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const message =
        err instanceof Error
          ? err.name === 'AbortError'
            ? 'Request timeout: Backend did not respond within configured limit'
            : err.message
          : 'Failed to communicate with backend server';

      return {
        success: false,
        data: null,
        error: message,
        isMockFallback: true,
      };
    }
  }

  public static async post<T, B = unknown>(
    endpoint: string,
    body: B
  ): Promise<ApiClientResult<T>> {
    if (!API_CONFIG.isConfigured()) {
      return {
        success: false,
        data: null,
        error: 'API base URL is not configured. Running in offline development mode.',
        isMockFallback: true,
      };
    }

    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        return {
          success: false,
          data: null,
          statusCode: response.status,
          error: `Backend error HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const json = await response.json();
      return {
        success: true,
        data: json as T,
        error: null,
        statusCode: response.status,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const message = err instanceof Error ? err.message : 'Backend request failed';
      return {
        success: false,
        data: null,
        error: message,
        isMockFallback: true,
      };
    }
  }
}
