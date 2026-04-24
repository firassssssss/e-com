module.exports = {
  preset: 'ts-jest/presets/default-esm',
  reporters: [
    "default",
    ["jest-html-reporter", {
      "pageTitle": "Test Report"
    }]
  ],
  testEnvironment: 'node',
  roots: ['<rootDir>/src'], // Look for tests in the 'src' directory
  testMatch: [ // Pattern to find test files
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    // Handle .js extensions in ESM imports
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Run DB cleanup & teardown hooks
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
