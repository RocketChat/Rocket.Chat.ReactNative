const fs = require('fs');
const { SourceSkips } = require('@expo/fingerprint');

const { nativePatchFiles } = require('./.github/scripts/native-patches');
const { codegenConfig } = require('./package.json');

/** @type {import('@expo/fingerprint').Config} */
module.exports = {
	sourceSkips: SourceSkips.ExpoConfigVersions | SourceSkips.PackageJsonScriptsAll | SourceSkips.GitIgnore,
	ignorePaths: ['patches/**/*', 'android/fastlane/**/*', 'ios/fastlane/**/*'],
	extraSources: [
		...nativePatchFiles('patches').map(filePath => ({
			type: 'contents',
			id: filePath,
			contents: fs.readFileSync(filePath, 'utf8'),
			reasons: ['nativePatch']
		})),
		{ type: 'dir', filePath: codegenConfig.jsSrcsDir.replace(/^\.\//, ''), reasons: ['codegenSpecs'] },
		{ type: 'contents', id: 'codegenConfig', contents: JSON.stringify(codegenConfig), reasons: ['codegenConfig'] }
	]
};
