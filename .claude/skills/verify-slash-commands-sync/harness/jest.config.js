const os = require('os');
const path = require('path');

const repo = path.resolve(__dirname, '../../../..');
const repoConfig = require(path.join(repo, 'jest.config.js'));
const repoPreset = require(path.join(repo, 'jest.preset.js'));

const SCRIPT_TRANSFORM = '\\.[jt]sx?$';
const [, babelOptions] = repoPreset.transform[SCRIPT_TRANSFORM];

module.exports = {
	...repoConfig,
	rootDir: repo,
	roots: [__dirname, repo],
	testMatch: [path.join(__dirname, '*.verify.ts')],
	testPathIgnorePatterns: ['node_modules'],
	maxWorkers: 1,
	cacheDirectory: process.env.VERIFY_JEST_CACHE ?? path.join(os.tmpdir(), 'verify-slash-commands-sync-jest'),
	transform: {
		...repoPreset.transform,
		[SCRIPT_TRANSFORM]: [path.join(__dirname, 'mutatingTransformer.js'), babelOptions]
	}
};
