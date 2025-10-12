import * as Sentry from '@sentry/react-native';
import { reactNavigationIntegration } from '@sentry/react-native';
import { config, isProduction, isDevelopment } from '@/config';
import { logger } from '@/utils/logger';
import Constants from 'expo-constants';

class ErrorTrackingService {
  private initialized = false;
  private navigationIntegration = reactNavigationIntegration();

  initialize(): void {
    if (!config.enableErrorReporting || !config.sentryDsn) {
      logger.info('Error tracking disabled or DSN not configured');
      return;
    }

    try {
      Sentry.init({
        dsn: config.sentryDsn,
        environment: config.appEnv,
        enabled: config.enableErrorReporting,
        debug: isDevelopment,
        tracesSampleRate: isProduction ? 0.2 : 1.0,
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
        integrations: [
          this.navigationIntegration,
        ],
        beforeSend: (event, hint) => {
          // Filter out non-critical errors in development
          if (isDevelopment && event.level === 'warning') {
            return null;
          }

          // Sanitize sensitive data
          if (event.request?.headers) {
            delete event.request.headers.Authorization;
            delete event.request.headers.authorization;
          }

          return event;
        },
      });

      // Set app context
      Sentry.setContext('app', {
        version: Constants.expoConfig?.version,
        buildNumber: Constants.expoConfig?.ios?.buildNumber,
        environment: config.appEnv,
      });

      this.initialized = true;
      logger.info('Error tracking service initialized');
    } catch (error) {
      logger.error('Failed to initialize error tracking', error);
    }
  }

  getNavigationIntegration() {
    return this.navigationIntegration;
  }

  captureException(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) {
      logger.error('Error (tracking disabled)', { error, context });
      return;
    }

    try {
      if (context) {
        Sentry.setContext('error_context', context);
      }

      Sentry.captureException(error);
      logger.error('Exception captured', { error: error.message, context });
    } catch (err) {
      logger.error('Failed to capture exception', err);
    }
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    if (!this.initialized) return;

    try {
      Sentry.captureMessage(message, level);
      logger.debug('Message captured', { message, level });
    } catch (error) {
      logger.error('Failed to capture message', error);
    }
  }

  setUser(userId: string, email?: string, username?: string): void {
    if (!this.initialized) return;

    try {
      Sentry.setUser({
        id: userId,
        email,
        username,
      });

      logger.info('User set in error tracking', { userId });
    } catch (error) {
      logger.error('Failed to set user', error);
    }
  }

  clearUser(): void {
    if (!this.initialized) return;

    try {
      Sentry.setUser(null);
      logger.info('User cleared from error tracking');
    } catch (error) {
      logger.error('Failed to clear user', error);
    }
  }

  addBreadcrumb(
    message: string,
    category: string,
    level: Sentry.SeverityLevel = 'info',
    data?: Record<string, any>
  ): void {
    if (!this.initialized) return;

    try {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000,
      });
    } catch (error) {
      logger.error('Failed to add breadcrumb', error);
    }
  }

  setTag(key: string, value: string): void {
    if (!this.initialized) return;

    try {
      Sentry.setTag(key, value);
    } catch (error) {
      logger.error('Failed to set tag', error);
    }
  }

  setContext(key: string, context: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      Sentry.setContext(key, context);
    } catch (error) {
      logger.error('Failed to set context', error);
    }
  }

  // Convenience methods for common scenarios
  captureApiError(endpoint: string, error: any, statusCode?: number): void {
    this.captureException(error instanceof Error ? error : new Error(String(error)), {
      type: 'api_error',
      endpoint,
      statusCode,
    });
  }

  captureNavigationError(screen: string, error: Error): void {
    this.captureException(error, {
      type: 'navigation_error',
      screen,
    });
  }

  captureAuthError(action: string, error: Error): void {
    this.captureException(error, {
      type: 'auth_error',
      action,
    });
  }

  captureSSEError(chatId: string, error: Error): void {
    this.captureException(error, {
      type: 'sse_error',
      chatId,
    });
  }
}

export const errorTrackingService = new ErrorTrackingService();
