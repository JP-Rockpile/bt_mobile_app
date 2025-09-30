export type UUID = string & { readonly __brand: unique symbol };

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: UUID;
  threadId: UUID;
  role: ChatRole;
  content: string;
  createdAt: string; // ISO string
  metadata?: Record<string, unknown>;
}

export interface BetRecommendation {
  id: UUID;
  market: string;
  selection: string;
  odds: number;
  stakeSuggested: number;
  sportsbook: string;
  potentialPayout: number;
}

export interface ConfirmBetPayload {
  recommendationId: UUID;
  stake: number;
}

export interface PushTokenRegistration {
  deviceId: string;
  token: string;
  platform: 'ios' | 'android';
}
