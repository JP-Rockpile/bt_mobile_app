import { init, track, identify, Identify } from '@amplitude/analytics-react-native';
import config from '@config/index';
import { AnalyticsEventName, User } from '@types/index';
import { logger } from '@utils/logger';

class AnalyticsService {
  private initialized = false;

  async initialize() {
    if (!config.features.enableAnalytics || !config.amplitude.apiKey) {
      logger.info('Analytics disabled or no API key provided');
      return;
    }

    try {
      await init(config.amplitude.apiKey, undefined, {
        trackingSessionEvents: true,
        defaultTracking: {
          sessions: true,
          pageViews: false,
          formInteractions: false,
          fileDownloads: false,
        },
      });
      
      this.initialized = true;
      logger.info('Analytics initialized');
    } catch (error) {
      logger.error('Failed to initialize analytics', error);
    }
  }

  async identifyUser(user: User) {
    if (!this.initialized) return;

    try {
      const identifyObj = new Identify();
      identifyObj.set('email', user.email);
      identifyObj.set('name', user.name);
      identifyObj.set('created_at', user.createdAt.toISOString());
      
      await identify(identifyObj);
      logger.info('User identified for analytics', { userId: user.id });
    } catch (error) {
      logger.error('Failed to identify user', error);
    }
  }

  async trackEvent(eventName: AnalyticsEventName, properties?: Record<string, any>) {
    if (!this.initialized) return;

    try {
      await track(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: config.environment,
      });
      
      logger.debug('Analytics event tracked', { eventName, properties });
    } catch (error) {
      logger.error('Failed to track event', { eventName, error });
    }
  }

  // Convenience methods for common events
  async trackAppOpened() {
    await this.trackEvent('app_opened');
  }

  async trackUserSignedIn(userId: string) {
    await this.trackEvent('user_signed_in', { userId });
  }

  async trackUserSignedOut() {
    await this.trackEvent('user_signed_out');
  }

  async trackChatStarted(chatId: string) {
    await this.trackEvent('chat_started', { chatId });
  }

  async trackMessageSent(chatId: string, messageLength: number) {
    await this.trackEvent('message_sent', { chatId, messageLength });
  }

  async trackMessageReceived(chatId: string, hasRecommendation: boolean) {
    await this.trackEvent('message_received', { chatId, hasRecommendation });
  }

  async trackBetRecommended(bet: any) {
    await this.trackEvent('bet_recommended', {
      betId: bet.id,
      sport: bet.sport,
      odds: bet.odds,
      stake: bet.stake,
      confidence: bet.confidence,
      sportsbook: bet.sportsbook.name,
    });
  }

  async trackBetConfirmed(betId: string) {
    await this.trackEvent('bet_confirmed', { betId });
  }

  async trackBetCancelled(betId: string) {
    await this.trackEvent('bet_cancelled', { betId });
  }

  async trackSportsbookOpened(sportsbookName: string, betId: string) {
    await this.trackEvent('sportsbook_opened', { sportsbookName, betId });
  }

  async trackError(error: Error, context?: string) {
    await this.trackEvent('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      context,
    });
  }

  async trackScreenView(screenName: string) {
    await this.trackEvent('screen_viewed', { screen_name: screenName });
  }
}

const analyticsService = new AnalyticsService();

export const initializeAnalytics = () => analyticsService.initialize();
export default analyticsService;