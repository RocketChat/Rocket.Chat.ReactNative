module.exports = {
	project: {
		ios: {},
		android: {} // grouped into "project"
	},
	assets: ['./assets/fonts/'],
	dependencies: {
		'@react-native-firebase/app': {
			platforms: {
				android: null
			}
		},
		'@react-native-firebase/analytics': {
			platforms: {
				android: null
			}
		},
		'@react-native-firebase/crashlytics': {
			platforms: {
				android: null
			}
		},
		'react-native-jitsi-meet': {
			platforms: {
				android: null
			}
		}
	}
};
