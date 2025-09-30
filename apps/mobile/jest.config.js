module.exports = {
  preset: 'react-native',
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-reanimated|@react-navigation|expo(nent)?|@expo|expo-modules-core|sentry-expo)/)'
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
};
