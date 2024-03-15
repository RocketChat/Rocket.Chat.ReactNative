const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
	resolver: {
		resolverMainFields: ['sbmodern', 'react-native', 'browser', 'main'],
		sourceExts: process.env.RUNNING_E2E_TESTS ? ['mock.ts', ...defaultSourceExts] : defaultSourceExts
	}
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
