// jest.config.js
const { createDefaultPreset } = require('jest-expo');

const defaultPreset = createDefaultPreset();

/** @type {import('jest').Config} */
module.exports = {
  ...defaultPreset,
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'expo|' +
      '@expo|' +
      'react-native|' +
      '@react-native|' +
      'react-native-reanimated|' +
      'react-native-mmkv|' +
      '@shopify/react-native-skia|' +
      'expo-sqlite|' +
      'expo-haptics|' +
      'expo-notifications|' +
      'expo-background-fetch|' +
      'expo-task-manager|' +
      'expo-file-system' +
    '))',
  ],
  setupFilesAfterEnv: [],
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.d.ts',
    '!src/db/migrations/**',
  ],
};
