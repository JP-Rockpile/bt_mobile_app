import config from '@config/index';
import authService from './auth.service';
import { ApiResponse, ApiError } from '@types/index';
import { logger } from '@utils/logger';

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = config.apiUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const tokens = await authService.getStoredTokens();
    if (tokens?.accessToken) {
      return {
        'Authorization': `Bearer ${tokens.accessToken}`
      };
    }
    return {};
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let error: ApiError;
      
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        error = {
          code: errorData.code || response.status.toString(),
          message: errorData.message || response.statusText,
          details: errorData.details
        };
      } else {
        error = {
          code: response.status.toString(),
          message: response.statusText,
          details: await response.text()
        };
      }

      // Handle token expiration
      if (response.status === 401) {
        try {
          await authService.refreshAccessToken();
          // Retry the request with new token
          return this.retryRequest<T>(response.url, {
            method: response.headers.get('X-Original-Method') || 'GET',
            body: response.headers.get('X-Original-Body') || undefined
          });
        } catch (refreshError) {
          logger.error('Token refresh failed', refreshError);
          // Force re-authentication
          await authService.logout();
        }
      }

      return { error };
    }

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return { data };
    }

    return { data: await response.text() as any };
  }

  private async retryRequest<T>(url: string, options: RequestInit): Promise<ApiResponse<T>> {
    const authHeaders = await this.getAuthHeaders();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...(options.headers || {})
      }
    });
    return this.handleResponse<T>(response);
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const authHeaders = await this.getAuthHeaders();
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const url = `${this.baseUrl}${endpoint}${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.defaultHeaders,
          ...authHeaders,
          'X-Original-Method': 'GET'
        }
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      logger.error(`GET ${endpoint} failed`, error);
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network request failed',
          details: error
        }
      };
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const authHeaders = await this.getAuthHeaders();
      const url = `${this.baseUrl}${endpoint}`;
      const body = data ? JSON.stringify(data) : undefined;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          ...authHeaders,
          'X-Original-Method': 'POST',
          'X-Original-Body': body || ''
        },
        body
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      logger.error(`POST ${endpoint} failed`, error);
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network request failed',
          details: error
        }
      };
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const authHeaders = await this.getAuthHeaders();
      const url = `${this.baseUrl}${endpoint}`;
      const body = data ? JSON.stringify(data) : undefined;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...this.defaultHeaders,
          ...authHeaders,
          'X-Original-Method': 'PUT',
          'X-Original-Body': body || ''
        },
        body
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      logger.error(`PUT ${endpoint} failed`, error);
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network request failed',
          details: error
        }
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const authHeaders = await this.getAuthHeaders();
      const url = `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...this.defaultHeaders,
          ...authHeaders,
          'X-Original-Method': 'DELETE'
        }
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      logger.error(`DELETE ${endpoint} failed`, error);
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network request failed',
          details: error
        }
      };
    }
  }

  async *streamSSE(endpoint: string, data?: any): AsyncGenerator<any, void, unknown> {
    const authHeaders = await this.getAuthHeaders();
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          ...authHeaders,
          'Accept': 'text/event-stream'
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`SSE request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              yield JSON.parse(data);
            } catch (e) {
              logger.warn('Failed to parse SSE data', { data, error: e });
            }
          }
        }
      }
    } catch (error) {
      logger.error(`SSE stream ${endpoint} failed`, error);
      throw error;
    }
  }
}

export default new ApiClient();