const path = require('path');
const { generate } = require('@storybook/react-native/scripts/generate');
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

generate({
	configPath: path.resolve(__dirname, './.storybook')
});

const sourceExts = [...defaultSourceExts, 'mjs'];

const config = {
	transformer: {
		unstable_allowRequireContext: true
	},
	resolver: {
		sourceExts: process.env.RUNNING_E2E_TESTS ? ['mock.ts', ...sourceExts] : sourceExts
	}
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
