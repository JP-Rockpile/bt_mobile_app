import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_STAGING = process.env.APP_ENV === 'staging';
const IS_PROD = process.env.APP_ENV === 'production';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PROD ? 'Bet Think' : `Bet Think ${IS_STAGING ? '(Staging)' : '(Dev)'}`,
  slug: 'bet-think',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'betthink',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1E1E1E',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_PROD
      ? 'com.betthink.app'
      : IS_STAGING
      ? 'com.betthink.app.staging'
      : 'com.betthink.app.dev',
    buildNumber: '1',
    infoPlist: {
      UIBackgroundModes: ['remote-notification'],
      // Allow HTTP traffic in development
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: !IS_PROD,
        NSAllowsLocalNetworking: true,
      },
    },
    associatedDomains: [
      `applinks:${process.env.EXPO_PUBLIC_DOMAIN || 'betthink.app'}`,
    ],
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1E1E1E',
    },
    package: IS_PROD
      ? 'com.betthink.app'
      : IS_STAGING
      ? 'com.betthink.app.staging'
      : 'com.betthink.app.dev',
    versionCode: 1,
    permissions: ['NOTIFICATIONS', 'INTERNET', 'ACCESS_NETWORK_STATE'],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: process.env.EXPO_PUBLIC_DOMAIN || 'betthink.app',
            pathPrefix: '/chat',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        color: '#2196F3',
      },
    ],
    [
      '@sentry/react-native',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        url: 'https://sentry.io/',
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
    'expo-secure-store',
    'expo-sqlite',
    'expo-web-browser',
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    auth0Domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN,
    auth0ClientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID,
    auth0Audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
    amplitudeApiKey: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    appEnv: process.env.APP_ENV || 'development',
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
  updates: {
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`,
    fallbackToCacheTimeout: 0,
    enabled: true,
  },
  runtimeVersion: '1.0.0',
});
