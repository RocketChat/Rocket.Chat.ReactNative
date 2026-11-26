const os = require('os');
const path = require('path');

const repo = path.resolve(__dirname, '../../../..');
const repoConfig = require(path.join(repo, 'jest.config.js'));

module.exports = {
	...repoConfig,
	rootDir: repo,
	roots: [repo],
	testMatch: [path.join(__dirname, '*.verify.ts')],
	testPathIgnorePatterns: ['node_modules'],
	maxWorkers: 1,
	cacheDirectory: process.env.VERIFY_JEST_CACHE ?? path.join(os.tmpdir(), 'verify-login-fetch-ordering-jest')
};
