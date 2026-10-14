const fs = require('fs');
const { SourceSkips } = require('@expo/fingerprint');

const { patchFilesFor } = require('./.github/scripts/platform-patches');
const { codegenConfig } = require('./package.json');
const expoModulesAutolinking = require('expo-modules-autolinking/package.json');

const platform = process.env.FINGERPRINT_PLATFORM;

const ANDROID_RESOURCE_ASSET_PATTERN = /\.(png|jpe?g|gif|webp|mp3|wav)$/;
const androidResourceAssetFiles = () =>
	fs
		.readdirSync('app', { recursive: true })
		.filter(filePath => ANDROID_RESOURCE_ASSET_PATTERN.test(filePath))
		.sort()
		.map(filePath => `app/${filePath}`);

/** @type {import('@expo/fingerprint').Config} */
module.exports = {
	sourceSkips: SourceSkips.ExpoConfigVersions | SourceSkips.PackageJsonScriptsAll | SourceSkips.GitIgnore,
	ignorePaths: ['patches/**/*', 'android/fastlane/**/*', 'ios/fastlane/**/*'],
	extraSources: [
		...patchFilesFor('patches', platform).map(filePath => ({
			type: 'contents',
			id: filePath,
			contents: fs.readFileSync(filePath, 'utf8'),
			reasons: ['patch']
		})),
		{ type: 'dir', filePath: codegenConfig.jsSrcsDir.replace(/^\.\//, ''), reasons: ['codegenSpecs'] },
		{ type: 'contents', id: 'codegenConfig', contents: JSON.stringify(codegenConfig), reasons: ['codegenConfig'] },
		...(platform === 'ios' ? [] : androidResourceAssetFiles()).map(filePath => ({
			type: 'file',
			filePath,
			reasons: ['androidResourceAsset']
		})),
		{
			type: 'contents',
			id: 'expoModulesAutolinkingVersion',
			contents: expoModulesAutolinking.version,
			reasons: ['expoModulesAutolinking']
		}
	]
};
