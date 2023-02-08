/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
	rootDir: '..',
	testMatch: ['<rootDir>/e2e/tests/**/*.spec.ts'],
	testTimeout: 120000,
	maxWorkers: 1,
	globalSetup: '<rootDir>/e2e/globalSetup.ts',
	globalTeardown: 'detox/runners/jest/globalTeardown',
	reporters: ['detox/runners/jest/reporter'],
	testEnvironment: 'detox/runners/jest/testEnvironment',
	verbose: true
};
