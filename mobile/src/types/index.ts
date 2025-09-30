// Core domain types
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: MessageMetadata;
  createdAt: Date;
}

export interface MessageMetadata {
  betRecommendation?: BetRecommendation;
  error?: string;
  isStreaming?: boolean;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

export interface BetRecommendation {
  id: string;
  sport: string;
  event: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  potentialPayout: number;
  sportsbook: Sportsbook;
  reasoning?: string;
  confidence: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}

export interface Sportsbook {
  id: string;
  name: string;
  deepLinkScheme: string;
  webUrl: string;
  logo?: string;
}

export interface BetSlip {
  id: string;
  userId: string;
  recommendation: BetRecommendation;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  confirmedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: Date;
    requestId: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Authentication types
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  error: string | null;
}

// Push notification types
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export type AnalyticsEventName = 
  | 'app_opened'
  | 'user_signed_in'
  | 'user_signed_out'
  | 'chat_started'
  | 'message_sent'
  | 'message_received'
  | 'bet_recommended'
  | 'bet_confirmed'
  | 'bet_cancelled'
  | 'sportsbook_opened'
  | 'error_occurred'
  | 'screen_viewed';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Chat: { chatId?: string };
  BetDetails: { betId: string };
  Settings: undefined;
  Profile: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Chats: undefined;
  Bets: undefined;
  Profile: undefined;
};

// Store types
export interface AppState {
  auth: AuthState;
  chats: ChatsState;
  ui: UIState;
  offline: OfflineState;
}

export interface ChatsState {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  isOnboarding: boolean;
  bottomSheetOpen: boolean;
  activeBetSlip: BetSlip | null;
}

export interface OfflineState {
  isOffline: boolean;
  pendingActions: OfflineAction[];
  syncStatus: 'idle' | 'syncing' | 'error';
}

export interface OfflineAction {
  id: string;
  type: 'message' | 'bet_confirm' | 'bet_cancel';
  payload: any;
  timestamp: Date;
  retryCount: number;
}