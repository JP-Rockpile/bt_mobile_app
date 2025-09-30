import Constants from 'expo-constants';

export interface AppConfig {
  apiUrl: string;
  auth0Domain: string;
  auth0ClientId: string;
  auth0Audience: string;
  amplitudeApiKey?: string;
  sentryDsn?: string;
  appEnv: 'development' | 'staging' | 'production';
  enableDevMenu: boolean;
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
}

const extra = Constants.expoConfig?.extra || {};

export const config: AppConfig = {
  apiUrl: extra.apiUrl || 'http://localhost:3000',
  auth0Domain: extra.auth0Domain || '',
  auth0ClientId: extra.auth0ClientId || '',
  auth0Audience: extra.auth0Audience || '',
  amplitudeApiKey: extra.amplitudeApiKey,
  sentryDsn: extra.sentryDsn,
  appEnv: extra.appEnv || 'development',
  enableDevMenu: extra.enableDevMenu !== false,
  enableAnalytics: extra.enableAnalytics === true,
  enableErrorReporting: extra.enableErrorReporting === true,
};

export const isDevelopment = config.appEnv === 'development';
export const isStaging = config.appEnv === 'staging';
export const isProduction = config.appEnv === 'production';
