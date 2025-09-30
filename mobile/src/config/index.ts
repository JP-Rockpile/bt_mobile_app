import Constants from 'expo-constants';

interface Config {
  apiUrl: string;
  auth0: {
    domain: string;
    clientId: string;
    audience: string;
    redirectUri: string;
    scope: string;
  };
  amplitude: {
    apiKey: string;
  };
  sentry: {
    dsn: string;
    environment: string;
  };
  environment: 'development' | 'staging' | 'production';
  features: {
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    enablePushNotifications: boolean;
    enableOfflineMode: boolean;
  };
}

const extra = Constants.expoConfig?.extra || {};

const config: Config = {
  apiUrl: extra.apiUrl || 'http://localhost:3000',
  auth0: {
    domain: extra.auth0Domain || '',
    clientId: extra.auth0ClientId || '',
    audience: extra.auth0Audience || '',
    redirectUri: `${Constants.expoConfig?.scheme}://auth`,
    scope: 'openid profile email offline_access'
  },
  amplitude: {
    apiKey: extra.amplitudeApiKey || ''
  },
  sentry: {
    dsn: extra.sentryDsn || '',
    environment: extra.environment || 'development'
  },
  environment: extra.environment || 'development',
  features: {
    enableAnalytics: extra.environment !== 'development',
    enableCrashReporting: extra.environment !== 'development',
    enablePushNotifications: true,
    enableOfflineMode: true
  }
};

export default config;