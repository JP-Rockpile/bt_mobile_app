import { init, track, Identify, identify, setUserId } from '@amplitude/analytics-react-native';
import { config, isProduction } from '@/config';
import { logger } from '@/utils/logger';
import type { EventName } from '@shared/types';

class AnalyticsService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (!config.enableAnalytics || !config.amplitudeApiKey) {
      logger.info('Analytics disabled or API key not configured');
      return;
    }

    try {
      await init(config.amplitudeApiKey, undefined, {
        trackingOptions: {
          ipAddress: false,
        },
        minIdLength: 1,
        logLevel: isProduction ? 2 : 1, // ERROR in prod, WARN in dev
      });

      this.initialized = true;
      logger.info('Analytics service initialized');
    } catch (error) {
      logger.error('Failed to initialize analytics', error);
    }
  }

  track(eventName: EventName, properties?: Record<string, any>): void {
    if (!this.initialized || !config.enableAnalytics) return;

    try {
      track(eventName, properties);
      logger.debug('Analytics event tracked', { eventName, properties });
    } catch (error) {
      logger.error('Failed to track analytics event', { eventName, error });
    }
  }

  identifyUser(userId: string, userProperties?: Record<string, any>): void {
    if (!this.initialized || !config.enableAnalytics) return;

    try {
      setUserId(userId);

      if (userProperties) {
        const identifyObj = new Identify();
        Object.entries(userProperties).forEach(([key, value]) => {
          identifyObj.set(key, value);
        });
        identify(identifyObj);
      }

      logger.info('User identified in analytics', { userId });
    } catch (error) {
      logger.error('Failed to identify user', { userId, error });
    }
  }

  setUserProperty(key: string, value: any): void {
    if (!this.initialized || !config.enableAnalytics) return;

    try {
      const identifyObj = new Identify();
      identifyObj.set(key, value);
      identify(identifyObj);

      logger.debug('User property set', { key, value });
    } catch (error) {
      logger.error('Failed to set user property', { key, error });
    }
  }

  incrementUserProperty(key: string, amount: number = 1): void {
    if (!this.initialized || !config.enableAnalytics) return;

    try {
      const identifyObj = new Identify();
      identifyObj.add(key, amount);
      identify(identifyObj);

      logger.debug('User property incremented', { key, amount });
    } catch (error) {
      logger.error('Failed to increment user property', { key, error });
    }
  }

  reset(): void {
    if (!this.initialized || !config.enableAnalytics) return;

    try {
      setUserId(undefined);
      logger.info('Analytics user reset');
    } catch (error) {
      logger.error('Failed to reset analytics', error);
    }
  }

  // Convenience methods for common events
  trackAppOpened(): void {
    this.track('app_opened', {
      timestamp: Date.now(),
      environment: config.appEnv,
    });
  }

  trackSessionStarted(sessionId: string): void {
    this.track('session_started', {
      sessionId,
      timestamp: Date.now(),
    });
  }

  trackChatMessageSent(chatId: string, messageLength: number): void {
    this.track('chat_message_sent', {
      chatId,
      messageLength,
      timestamp: Date.now(),
    });
  }

  trackChatMessageReceived(chatId: string, responseTime: number): void {
    this.track('chat_message_received', {
      chatId,
      responseTime,
      timestamp: Date.now(),
    });
  }

  trackBetRecommendationShown(recommendationId: string, sport: string): void {
    this.track('bet_recommendation_shown', {
      recommendationId,
      sport,
      timestamp: Date.now(),
    });
  }

  trackBetConfirmed(
    recommendationId: string,
    sport: string,
    stake: number,
    sportsbook: string
  ): void {
    this.track('bet_confirmed', {
      recommendationId,
      sport,
      stake,
      sportsbook,
      timestamp: Date.now(),
    });
  }

  trackBetCancelled(recommendationId: string, sport: string): void {
    this.track('bet_cancelled', {
      recommendationId,
      sport,
      timestamp: Date.now(),
    });
  }

  trackSportsbookRedirect(sportsbook: string, betType: string): void {
    this.track('sportsbook_redirect', {
      sportsbook,
      betType,
      timestamp: Date.now(),
    });
  }

  trackNotificationReceived(type: string): void {
    this.track('notification_received', {
      type,
      timestamp: Date.now(),
    });
  }

  trackNotificationOpened(type: string, notificationId: string): void {
    this.track('notification_opened', {
      type,
      notificationId,
      timestamp: Date.now(),
    });
  }

  trackError(errorCode: string, errorMessage: string, context?: Record<string, any>): void {
    this.track('error_occurred', {
      errorCode,
      errorMessage,
      ...context,
      timestamp: Date.now(),
    });
  }

  trackSSEConnection(status: 'established' | 'failed' | 'reconnection_attempted'): void {
    const eventMap = {
      established: 'sse_connection_established' as EventName,
      failed: 'sse_connection_failed' as EventName,
      reconnection_attempted: 'sse_reconnection_attempted' as EventName,
    };

    this.track(eventMap[status], {
      timestamp: Date.now(),
    });
  }
}

export const analyticsService = new AnalyticsService();
