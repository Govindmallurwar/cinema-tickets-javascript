export default {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/pairtest/**/*.js',
    '!src/thirdparty/**/*.js',
    '!src/pairtest/lib/logger.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/logs/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 100,
      lines: 97,
      statements: 97,
    },
  },
  testMatch: ['**/test/**/*.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};
