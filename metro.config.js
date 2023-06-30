// /**
//  * Metro configuration for React Native
//  * https://github.com/facebook/react-native
//  *
//  * @format
//  */

// // eslint-disable-next-line import/no-extraneous-dependencies
// const blocklist = require('metro-config/src/defaults/exclusionList');

// const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;

// module.exports = {
// 	transformer: {
// 		getTransformOptions: () => ({
// 			transform: {
// 				// experimentalImportSupport: true,
// 				inlineRequires: true
// 			}
// 		})
// 	},
// 	maxWorkers: 2,
// 	resolver: {
// 		resolverMainFields: ['sbmodern', 'react-native', 'browser', 'main'],
// 		sourceExts: process.env.RUNNING_E2E_TESTS ? ['mock.ts', ...defaultSourceExts] : defaultSourceExts
// 	}
// };

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
	// transformer: {
	// 	getTransformOptions: () => ({
	// 		transform: {
	// 			// experimentalImportSupport: true,
	// 			inlineRequires: true
	// 		}
	// 	})
	// },
	// maxWorkers: 2,
	resolver: {
		resolverMainFields: ['sbmodern', 'react-native', 'browser', 'main']
		// sourceExts: process.env.RUNNING_E2E_TESTS ? ['mock.ts', ...defaultSourceExts] : defaultSourceExts
	}
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
