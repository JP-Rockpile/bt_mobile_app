const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Add support for monorepo structure
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Add support for packages/shared
config.resolver.extraNodeModules = {
  '@shared': path.resolve(monorepoRoot, 'packages/shared/src'),
};

// Improve symbolication handling for Hermes
// The InternalBytecode.js errors are harmless warnings from Hermes engine
// when Metro tries to symbolicate stack traces
config.symbolicator = {
  customizeFrame: (frame) => {
    // Skip frames that reference InternalBytecode.js
    if (frame.file && frame.file.includes('InternalBytecode.js')) {
      return null;
    }
    return frame;
  },
};

module.exports = config;
