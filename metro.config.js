/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

// eslint-disable-next-line import/no-extraneous-dependencies
const blocklist = require('metro-config/src/defaults/exclusionList');

module.exports = {
	transformer: {
		getTransformOptions: () => ({
			transform: {
				// experimentalImportSupport: true,
				inlineRequires: true
			}
		})
	},
	maxWorkers: 2,
	resolver: {
		blocklistRE: blocklist([/ios\/Pods\/JitsiMeetSDK\/Frameworks\/JitsiMeet.framework\/assets\/node_modules\/react-native\/.*/]),
		resolverMainFields: ['sbmodern', 'react-native', 'browser', 'main']
	}
};
