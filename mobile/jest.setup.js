// Mock expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiUrl: 'http://localhost:3000',
      auth0Domain: 'test.auth0.com',
      auth0ClientId: 'test_client_id',
      auth0Audience: 'http://localhost:3000',
      amplitudeApiKey: 'test_amplitude_key',
      sentryDsn: 'test_sentry_dsn',
      environment: 'test',
      eas: {
        projectId: 'test-project-id'
      }
    },
    scheme: 'betthink'
  }
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  AuthRequest: {
    PKCE: {
      codeChallenge: jest.fn(() => 'test_code_challenge'),
    },
  },
  makeRedirectUri: jest.fn(() => 'betthink://auth'),
  fetchDiscoveryAsync: jest.fn(),
  exchangeCodeAsync: jest.fn(),
  refreshAsync: jest.fn(),
  ResponseType: {
    Code: 'code',
  },
  CodeChallengeMethod: {
    S256: 'S256',
  },
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openBrowserAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    BASE64URL: 'BASE64URL',
  },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getBadgeCountAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: {
    MAX: 'max',
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Test',
  modelName: 'TestModel',
  osVersion: '1.0',
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `betthink://${path}`),
  addEventListener: jest.fn(),
  getInitialURL: jest.fn(),
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

jest.mock('@amplitude/analytics-react-native', () => ({
  init: jest.fn(),
  track: jest.fn(),
  identify: jest.fn(),
  Identify: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Silence console during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};