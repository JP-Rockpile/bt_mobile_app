// Authentication Types
export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  idToken?: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  betRecommendation?: BetRecommendation;
  error?: string;
  tokensUsed?: number;
}

export interface ChatThread {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  messageCount: number;
}

export interface ChatHistoryResponse {
  threads: ChatThread[];
  total: number;
  page: number;
  pageSize: number;
}

// Betting Types
export interface BetRecommendation {
  id: string;
  sport: string;
  league: string;
  event: string;
  eventDate: string;
  betType: string;
  selection: string;
  odds: number;
  oddsFormat: 'decimal' | 'american' | 'fractional';
  stake: number;
  potentialPayout: number;
  sportsbook: Sportsbook;
  reasoning?: string;
  confidence?: number;
}

export interface Sportsbook {
  id: string;
  name: string;
  deepLinkScheme: string;
  deepLinkPath?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
}

export interface BetConfirmation {
  betRecommendationId: string;
  userId: string;
  chatId: string;
  messageId: string;
  confirmedAt: string;
  redirectedToSportsbook: boolean;
}

// SSE Stream Types
export interface SSEEvent {
  event: string;
  data: string;
  id?: string;
  retry?: number;
}

export interface StreamChunk {
  type: 'content' | 'metadata' | 'error' | 'done';
  content?: string;
  metadata?: MessageMetadata;
  error?: string;
}

// Notification Types
export interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  type: NotificationType;
  sentAt: string;
}

export type NotificationType =
  | 'bet_result'
  | 'bet_reminder'
  | 'chat_message'
  | 'system_alert';

export interface DeviceToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Analytics Event Types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export type EventName =
  | 'app_opened'
  | 'session_started'
  | 'chat_message_sent'
  | 'chat_message_received'
  | 'bet_recommendation_shown'
  | 'bet_confirmed'
  | 'bet_cancelled'
  | 'sportsbook_redirect'
  | 'notification_received'
  | 'notification_opened'
  | 'error_occurred'
  | 'sse_connection_established'
  | 'sse_connection_failed'
  | 'sse_reconnection_attempted';

// Sync Types
export interface SyncStatus {
  lastSyncAt?: string;
  pendingChanges: number;
  isSyncing: boolean;
  syncError?: string;
}

export interface LocalChatMessage extends ChatMessage {
  localId: string;
  synced: boolean;
  optimistic?: boolean;
}
