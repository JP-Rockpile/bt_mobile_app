import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config';
import { authService } from '@/services/auth.service';
import { logger } from '@/utils/logger';
import type { ApiResponse, ApiError } from '@shared/types';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor: Add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const token = await authService.getValidAccessToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          logger.warn('Failed to get access token for request', error);
        }

        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle token refresh on 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue this request until token is refreshed
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const tokens = await authService.refreshToken();
            this.isRefreshing = false;

            // Retry all queued requests with new token
            this.refreshSubscribers.forEach((callback) => callback(tokens.accessToken));
            this.refreshSubscribers = [];

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            logger.error('Token refresh failed in interceptor', refreshError);
            // Clear auth and redirect to login would happen here
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private normalizeError(error: AxiosError): ApiError {
    if (error.response) {
      const data = error.response.data as any;
      return {
        code: data?.error?.code || 'API_ERROR',
        message: data?.error?.message || error.message,
        details: data?.error?.details,
        statusCode: error.response.status,
      };
    }

    if (error.request) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
        statusCode: 0,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      statusCode: 0,
    };
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    try {
      logger.debug(`API GET: ${url}`, params);
      const response = await this.client.get<ApiResponse<T>>(url, { params });
      return response.data.data as T;
    } catch (error) {
      logger.apiError(url, error);
      throw error;
    }
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    try {
      logger.debug(`API POST: ${url}`);
      const response = await this.client.post<ApiResponse<T>>(url, data);
      return response.data.data as T;
    } catch (error) {
      logger.apiError(url, error);
      throw error;
    }
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    try {
      logger.debug(`API PUT: ${url}`);
      const response = await this.client.put<ApiResponse<T>>(url, data);
      return response.data.data as T;
    } catch (error) {
      logger.apiError(url, error);
      throw error;
    }
  }

  async delete<T>(url: string): Promise<T> {
    try {
      logger.debug(`API DELETE: ${url}`);
      const response = await this.client.delete<ApiResponse<T>>(url);
      return response.data.data as T;
    } catch (error) {
      logger.apiError(url, error);
      throw error;
    }
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    try {
      logger.debug(`API PATCH: ${url}`);
      const response = await this.client.patch<ApiResponse<T>>(url, data);
      return response.data.data as T;
    } catch (error) {
      logger.apiError(url, error);
      throw error;
    }
  }

  // For streaming endpoints (SSE)
  getStreamUrl(path: string): string {
    return `${config.apiUrl}${path}`;
  }
}

export const apiClient = new ApiClient();
