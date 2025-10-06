module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/disabled/'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(yahoo-finance2|node-fetch)/)'
  ],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/*.test.ts',
    '!**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: [],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testTimeout: 10000,
  verbose: true,
  extensionsToTreatAsEsm: ['.ts']
};
