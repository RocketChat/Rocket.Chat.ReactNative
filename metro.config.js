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
		sourceExts: process.env.RUNNING_E2E_TESTS ? ['mock.ts', ...sourceExts] : sourceExts
	}
};

module.exports = withStorybook(wrapWithReanimatedMetroConfig(mergeConfig(getDefaultConfig(__dirname), config)), {
	// set to false to disable storybook specific settings
	// you can use a env variable to toggle this
	enabled: process.env.USE_STORYBOOK === 'true',
	// path to your storybook config folder
	configPath: path.resolve(__dirname, './.storybook')
});
