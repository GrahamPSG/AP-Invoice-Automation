module.exports = {
  displayName: 'API',
  testMatch: ['<rootDir>/apps/api/**/*.spec.ts', '<rootDir>/apps/api/**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'apps/api/src/**/*.(t|j)s',
    '!apps/api/src/**/*.spec.ts',
    '!apps/api/src/**/*.test.ts',
  ],
  coverageDirectory: './coverage/api',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@shared/(.*)$': '<rootDir>/packages/shared/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/apps/api/test/setup.ts'],
}