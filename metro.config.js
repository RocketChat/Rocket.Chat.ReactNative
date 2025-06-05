const path = require('path');
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;
// eslint-disable-next-line import/no-unresolved
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const withStorybook = require('@storybook/react-native/metro/withStorybook');

const sourceExts = [...defaultSourceExts, 'mjs'];

const config = {
	transformer: {
		unstable_allowRequireContext: true
	},
	resolver: {
		sourceExts: process.env.RUNNING_E2E_TESTS ? ['mock.ts', ...sourceExts] : sourceExts
	}
};

const baseConfig = wrapWithReanimatedMetroConfig(mergeConfig(getDefaultConfig(__dirname), config));

module.exports = withStorybook(baseConfig, {
	enabled: true,
	configPath: path.resolve(__dirname, './.storybook')
});
