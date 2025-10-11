import { apiClient } from './client';
import type {
  Conversation as ChatThread,
  ChatMessage,
  ConversationListResponse as ChatHistoryResponse,
  BetRecommendation,
  BetConfirmation,
  DeviceToken,
  PaginationParams,
} from '@betthink/shared';

// Chat Endpoints
export const chatApi = {
  getThreads: (params?: PaginationParams) =>
    apiClient.get<ChatHistoryResponse>('/api/chat/threads', params),

  getThread: (threadId: string) =>
    apiClient.get<ChatThread>(`/api/chat/threads/${threadId}`),

  createThread: (title?: string) =>
    apiClient.post<ChatThread>('/api/chat/threads', { title }),

  deleteThread: (threadId: string) =>
    apiClient.delete<void>(`/api/chat/threads/${threadId}`),

  getMessages: (threadId: string, params?: PaginationParams) =>
    apiClient.get<ChatMessage[]>(`/api/chat/threads/${threadId}/messages`, params),

  sendMessage: (threadId: string, content: string) =>
    apiClient.post<ChatMessage>(`/api/chat/threads/${threadId}/messages`, { content }),

  // Returns SSE stream URL
  getStreamUrl: (threadId: string) =>
    apiClient.getStreamUrl(`/api/chat/threads/${threadId}/stream`),
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
