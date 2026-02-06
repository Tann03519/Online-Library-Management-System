module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'routes/**/*.js',
        'models/**/*.js',
        'middleware/**/*.js',
        'utils/**/*.js',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    maxWorkers: 1, // Run tests sequentially to avoid database conflicts
    testTimeout: 30000
};
