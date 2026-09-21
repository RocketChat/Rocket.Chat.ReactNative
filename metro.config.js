const fs = require('fs');
const path = require('path');
const withStorybook = require('@storybook/react-native/metro/withStorybook');

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const sourceExts = [...defaultConfig.resolver.sourceExts, 'mjs'];

const nativeStackPath = path.join(__dirname, 'node_modules/@react-navigation/native-stack');
const localNavigation = fs.lstatSync(nativeStackPath).isSymbolicLink();
const localPackagePaths = [
	fs.realpathSync(nativeStackPath),
	fs.realpathSync(path.join(__dirname, 'node_modules/react-native-screens'))
];

const config = {
	...(localNavigation && {
		watchFolders: localPackagePaths
	}),
	transformer: {
		unstable_allowRequireContext: true
	},
	resolver: {
		...(localNavigation && {
			nodeModulesPaths: [
				path.join(__dirname, 'node_modules'),
				path.join(localPackagePaths[0], 'node_modules'),
				path.join(localPackagePaths[1], 'node_modules')
			],
			resolveRequest: (context, moduleName, platform) =>
				context.resolveRequest(
					localPackagePaths.some(directory => context.originModulePath.startsWith(`${directory}${path.sep}`))
						? { ...context, disableHierarchicalLookup: true }
						: context,
					moduleName === '@react-navigation/native-stack'
						? path.join(localPackagePaths[0], 'src/index.tsx')
						: moduleName === 'react-native-screens'
							? path.join(localPackagePaths[1], 'src/index.tsx')
							: moduleName,
					platform
				)
		}),
		// When running E2E tests, prioritize .mock.ts files for app code
		sourceExts: process.env.RUNNING_E2E_TESTS === 'true' ? ['mock.ts', ...sourceExts] : sourceExts
	}
};

const finalConfig = wrapWithReanimatedMetroConfig(mergeConfig(getDefaultConfig(__dirname), config));

const storybookOptions = {
	// set to false to disable storybook specific settings
	// you can use a env variable to toggle this
	enabled: process.env.USE_STORYBOOK === 'true',
	// path to your storybook config folder
	configPath: path.resolve(__dirname, './.rnstorybook'),
	// set this to true to remove storybook from the bundle when disabled
	onDisabledRemoveStorybook: true
};

module.exports = withStorybook(finalConfig, storybookOptions);
