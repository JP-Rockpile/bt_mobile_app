import { apiClient } from './client';
import type {
  Conversation as ChatThread,
  ChatMessage,
  ConversationListResponse as ChatHistoryResponse,
  BetConfirmation,
  DeviceToken,
  PaginationParams,
} from '@betthink/shared';
import type { BetRecommendation } from '@/types/bet';

// Chat Endpoints
// Note: Backend uses "conversations" terminology in API paths
// but we maintain "threads" in our frontend for consistency
export const chatApi = {
  getThreads: (params?: PaginationParams) =>
    apiClient.get<ChatHistoryResponse>('/api/v1/chat/conversations', params),

  getThread: (threadId: string) =>
    apiClient.get<ChatThread>(`/api/v1/chat/conversations/${threadId}`),

  createThread: (title?: string, initialMessage?: string) =>
    apiClient.post<ChatThread>('/api/v1/chat/conversations', { title, initialMessage }),

  deleteThread: (threadId: string) =>
    apiClient.delete<void>(`/api/v1/chat/conversations/${threadId}`),

  getMessages: (threadId: string, params?: PaginationParams) =>
    apiClient.get<ChatMessage[]>(`/api/v1/chat/conversations/${threadId}/history`, params),

  sendMessage: (threadId: string, content: string) =>
    apiClient.post<ChatMessage>(`/api/v1/chat/conversations/${threadId}/messages`, { content }),

  // Returns SSE stream URL
  getStreamUrl: (threadId: string) =>
    apiClient.getStreamUrl(`/api/v1/chat/conversations/${threadId}/stream`),
};

// Betting Endpoints
export const bettingApi = {
  getBetRecommendation: (recommendationId: string) =>
    apiClient.get<BetRecommendation>(`/api/bets/recommendations/${recommendationId}`),

  confirmBet: (data: Omit<BetConfirmation, 'confirmedAt'>) =>
    apiClient.post<BetConfirmation>('/api/bets/confirmations', data),

  getBetHistory: (params?: PaginationParams) =>
    apiClient.get<BetConfirmation[]>('/api/bets/history', params),
};

// Notification Endpoints
export const notificationApi = {
  registerDevice: (data: Omit<DeviceToken, 'createdAt'>) =>
    apiClient.post<DeviceToken>('/api/notifications/devices', data),

  unregisterDevice: (deviceId: string) =>
    apiClient.delete<void>(`/api/notifications/devices/${deviceId}`),

  getNotifications: (params?: PaginationParams) =>
    apiClient.get('/api/notifications', params),

  markAsRead: (notificationId: string) =>
    apiClient.patch<void>(`/api/notifications/${notificationId}/read`, {}),
};

// User Endpoints
export const userApi = {
  getCurrentUser: () => apiClient.get('/api/users/me'),

  updateProfile: (data: { name?: string; picture?: string }) =>
    apiClient.patch('/api/users/me', data),

  deleteAccount: () => apiClient.delete('/api/users/me'),
};
