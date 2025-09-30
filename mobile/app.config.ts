import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_STAGING = process.env.APP_VARIANT === 'staging';
const IS_PROD = process.env.APP_VARIANT === 'production';

const getUniqueIdentifier = () => {
  if (IS_DEV) return 'com.betthink.app.dev';
  if (IS_STAGING) return 'com.betthink.app.staging';
  return 'com.betthink.app';
};

const getAppName = () => {
  if (IS_DEV) return 'Bet Think (Dev)';
  if (IS_STAGING) return 'Bet Think (Staging)';
  return 'Bet Think';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: 'bet-think',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'betthink',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
    config: {
      usesNonExemptEncryption: false
    },
    infoPlist: {
      NSUserTrackingUsageDescription: 'This identifier will be used to deliver personalized ads to you.',
      NSFaceIDUsageDescription: 'Allow Bet Think to use Face ID for authentication'
    },
    associatedDomains: [
      'applinks:betthink.com',
      'applinks:*.betthink.com'
    ]
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: getUniqueIdentifier(),
    permissions: [
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
      'USE_FINGERPRINT',
      'USE_BIOMETRIC'
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'betthink.com',
            pathPrefix: '/'
          },
          {
            scheme: 'https',
            host: '*.betthink.com',
            pathPrefix: '/'
          }
        ],
        category: ['BROWSABLE', 'DEFAULT']
      }
    ]
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro'
  },
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#ffffff',
        sounds: ['./assets/notification-sound.wav']
      }
    ],
    [
      'expo-updates',
      {
        username: 'betthink'
      }
    ],
    'expo-secure-store',
    '@sentry/react-native/expo',
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '13.0'
        },
        android: {
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          buildToolsVersion: '34.0.0',
          minSdkVersion: 21
        }
      }
    ]
  ],
  extra: {
    eas: {
      projectId: 'your-project-id'
    },
    apiUrl: process.env.API_URL || 'https://api.betthink.com',
    auth0Domain: process.env.AUTH0_DOMAIN || 'betthink.auth0.com',
    auth0ClientId: process.env.AUTH0_CLIENT_ID || '',
    auth0Audience: process.env.AUTH0_AUDIENCE || 'https://api.betthink.com',
    amplitudeApiKey: process.env.AMPLITUDE_API_KEY || '',
    sentryDsn: process.env.SENTRY_DSN || '',
    environment: process.env.APP_VARIANT || 'development'
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/your-project-id',
    enabled: !IS_DEV,
    checkAutomatically: 'ON_LOAD',
    channel: IS_PROD ? 'production' : IS_STAGING ? 'staging' : 'development'
  },
  runtimeVersion: {
    policy: 'sdkVersion'
  }
});