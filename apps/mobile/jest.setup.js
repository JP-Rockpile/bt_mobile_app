import '@testing-library/jest-native/extend-expect';

// Mock environment variables
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
process.env.EXPO_PUBLIC_AUTH0_DOMAIN = 'test.auth0.com';
process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID = 'test-client-id';
process.env.EXPO_PUBLIC_WS_URL = 'ws://localhost:3000';

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: null,
  })),
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock Auth0
jest.mock('react-native-auth0', () => {
  const mockAuth0Instance = {
    webAuth: {
      authorize: jest.fn(),
      clearSession: jest.fn(),
    },
    auth: {
      refreshToken: jest.fn(),
      userInfo: jest.fn(),
    },
  };
  
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockAuth0Instance),
    Auth0: jest.fn().mockImplementation(() => mockAuth0Instance),
  };
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

global.fetch = jest.fn();
