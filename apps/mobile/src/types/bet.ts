/**
 * Local type definitions for betting features
 * These supplement the types from @betthink/shared
 */

import type { Sportsbook } from '@betthink/shared';

/**
 * Bet recommendation from the AI assistant
 * This type matches the backend OpenAPI specification
 */
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
  reasoning: string;
  confidence: number;
}

