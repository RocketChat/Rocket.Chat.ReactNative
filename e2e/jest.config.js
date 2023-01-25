/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
	rootDir: '..',
	setupFilesAfterEnv: ['<rootDir>/e2e/tests/init.ts'],
	testMatch: ['<rootDir>/e2e/tests/**/*.spec.ts'],
	testTimeout: 120000,
	maxWorkers: 1,
	globalSetup: 'detox/runners/jest/globalSetup',
	globalTeardown: 'detox/runners/jest/globalTeardown',
	reporters: ['detox/runners/jest/reporter'],
	testEnvironment: 'detox/runners/jest/testEnvironment',
	verbose: true
};
