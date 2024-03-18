const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;
const { getDefaultConfig } = require('expo/metro-config');

const config = {
	resolver: {
		resolverMainFields: ['sbmodern', 'react-native', 'browser', 'main'],
		sourceExts: process.env.RUNNING_E2E_TESTS ? ['mock.ts', ...defaultSourceExts] : defaultSourceExts
	}
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
