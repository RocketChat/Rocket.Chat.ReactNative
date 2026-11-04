const fs = require('fs');
const path = require('path');

const PLATFORM_ONLY_PATH_PATTERNS = {
	android: /(^|\/)android\/|\.(java|kt|kts|gradle)$/,
	ios: /(^|\/)(ios|apple)\/|\.(swift|m|mm|podspec)$/
};

const patchedPaths = patchContents =>
	[...patchContents.matchAll(/^(?:---|\+\+\+) [ab]\/(\S+)/gm)].map(([, patchedPath]) => patchedPath);

const otherPlatform = platform => (platform === 'android' ? 'ios' : 'android');

const patchAppliesTo = (patchContents, platform) => {
	const paths = patchedPaths(patchContents);
	const otherPlatformOnly = PLATFORM_ONLY_PATH_PATTERNS[otherPlatform(platform)];
	return paths.length === 0 || !paths.every(patchedPath => otherPlatformOnly.test(patchedPath));
};

const patchFilesFor = (patchesDir, platform) =>
	fs
		.readdirSync(patchesDir)
		.filter(fileName => fileName.endsWith('.patch'))
		.sort()
		.map(fileName => path.join(patchesDir, fileName))
		.filter(filePath => !platform || patchAppliesTo(fs.readFileSync(filePath, 'utf8'), platform));

module.exports = { patchAppliesTo, patchFilesFor };
