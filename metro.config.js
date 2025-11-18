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
		// When running E2E tests, prioritize .mock.ts files ONLY in app/ directory
		// Exclude node_modules to prevent loading library-internal mocks
		sourceExts: process.env.RUNNING_E2E_TESTS === 'true' ? ['mock.ts', ...sourceExts] : sourceExts,
		resolveRequest:
			process.env.RUNNING_E2E_TESTS === 'true'
				? (context, moduleName, platform) => {
						// Only apply mock resolution to app code, not node_modules
						if (moduleName.startsWith('react-native-mmkv')) {
							// Force react-native-mmkv to use real files, not .mock.ts
							return context.resolveRequest(
								context,
								moduleName,
								platform,
								// Override sourceExts for this specific module
								{ ...context, preferredSourceExts: sourceExts }
							);
						}
						// Default resolution for everything else
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
