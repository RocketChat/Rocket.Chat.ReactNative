/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
	rootDir: '..',
	testSequencer: '<rootDir>/e2e/testSequencer.js',
	testMatch: ['<rootDir>/e2e/tests/**/*.spec.ts'],
	testTimeout: 120000,
	maxWorkers: process.env.CI ? 1 : 3, // ci already uses parallelism
	globalSetup: 'detox/runners/jest/globalSetup',
	globalTeardown: 'detox/runners/jest/globalTeardown',
	reporters: ['detox/runners/jest/reporter', 'jest-junit'],
	testEnvironment: 'detox/runners/jest/testEnvironment',
	verbose: true
};
