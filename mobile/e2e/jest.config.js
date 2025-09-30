module.exports = {
  maxWorkers: 1,
  testEnvironment: './environment',
  testRunner: 'jest-circus/runner',
  testTimeout: 120000,
  testRegex: '\\.test\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  reporters: ['detox/runners/jest/streamlineReporter'],
  verbose: true,
};