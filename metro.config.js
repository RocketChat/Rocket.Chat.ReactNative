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
				// https://github.com/storybookjs/react-native/issues/152
				inlineRequires: false
			}
		})
	},
	maxWorkers: 2,
	resolver: {
		blocklistRE: blocklist([
			/ios\/Pods\/JitsiMeetSDK\/Frameworks\/JitsiMeet.framework\/assets\/node_modules\/react-native\/.*/
		])
	}
};
