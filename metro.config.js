const path = require('path');
const withStorybook = require('@storybook/react-native/metro/withStorybook');
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;
// eslint-disable-next-line import/no-unresolved
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const sourceExts = [...defaultSourceExts, 'mjs'];

const config = {
	transformer: {
		unstable_allowRequireContext: true
	},
	resolver: {
		// When running E2E tests, prioritize .mock.ts files for app code
		sourceExts: process.env.RUNNING_E2E_TESTS === 'true' ? ['mock.ts', ...sourceExts] : sourceExts,
		// BUT exclude specific libraries from mock resolution
		resolveRequest:
			process.env.RUNNING_E2E_TESTS === 'true'
				? (context, moduleName, platform) => {
						// Check if we're resolving a module from within react-native-mmkv
						const isResolvingFromMMKV =
							context.originModulePath && context.originModulePath.includes('node_modules/react-native-mmkv');

						// Force these libraries to skip .mock.ts files
						if (moduleName.startsWith('react-native-mmkv') || isResolvingFromMMKV) {
							return context.resolveRequest(context, moduleName, platform, {
								...context,
								preferredSourceExts: sourceExts // Use normal extensions (no mock.ts)
							});
						}
						// Default resolution for everything else (including app code)
						return context.resolveRequest(context, moduleName, platform);
				  }
				: undefined
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
