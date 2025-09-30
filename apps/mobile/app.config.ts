import 'dotenv/config';
import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Bet Think',
  slug: 'bet-think',
  scheme: 'betthink',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0B0C10',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: process.env.IOS_BUNDLE_ID || 'com.betthink.app',
    associatedDomains: [process.env.IOS_ASSOCIATED_DOMAIN || 'applinks:betthink.app'],
  },
  android: {
    package: process.env.ANDROID_PACKAGE || 'com.betthink.app',
    intentFilters: [
      {
        action: 'VIEW',
        data: [{ scheme: 'https', host: process.env.DEEP_LINK_HOST || 'betthink.app' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  updates: {
    url: process.env.EAS_UPDATE_URL,
    enabled: true,
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    apiUrl: process.env.API_URL,
    auth0Domain: process.env.AUTH0_DOMAIN,
    auth0ClientId: process.env.AUTH0_CLIENT_ID,
    auth0Audience: process.env.AUTH0_AUDIENCE,
    amplitudeApiKey: process.env.AMPLITUDE_API_KEY,
    sentryDsn: process.env.SENTRY_DSN,
    ssePath: process.env.SSE_PATH || '/v1/chat/stream',
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
    env: process.env.APP_ENV || 'dev',
  },
  plugins: [
    'sentry-expo',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#66FCF1',
        mode: 'production',
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
        android: {
          kotlinVersion: '1.9.24',
          extraMavenRepos: ['https://jcenter.bintray.com/'],
        },
      },
    ],
  ],
});

