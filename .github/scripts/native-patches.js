const fs = require('fs');
const path = require('path');

const NATIVE_PATH_PATTERN =
	/(^|\/)(android|ios|apple|cpp)\/|\.(java|kt|kts|gradle|swift|m|mm|h|hpp|c|cc|cpp|podspec|plist|xml|pro|cmake)$|CMakeLists\.txt$|(^|\/)Native[A-Z]\w*\.ts$/;

const patchedPaths = patchContents =>
	[...patchContents.matchAll(/^diff --git a\/(\S+) b\/(\S+)$/gm)].flatMap(([, before, after]) => [before, after]);

const isNativePatch = patchContents => patchedPaths(patchContents).some(patchedPath => NATIVE_PATH_PATTERN.test(patchedPath));

const nativePatchFiles = patchesDir =>
	fs
		.readdirSync(patchesDir)
		.filter(fileName => fileName.endsWith('.patch'))
		.sort()
		.map(fileName => path.join(patchesDir, fileName))
		.filter(filePath => isNativePatch(fs.readFileSync(filePath, 'utf8')));

module.exports = { isNativePatch, nativePatchFiles };
