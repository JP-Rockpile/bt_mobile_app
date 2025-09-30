// ESLint v9 flat config (CommonJS)
let universe;
try {
  universe = require('eslint-config-universe/flat');
} catch (e) {
  universe = [];
}

module.exports = [
  ...universe,
  {
    ignores: ['**/node_modules/**', 'packages/shared/src/api/**', 'packages/shared/dist/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];

