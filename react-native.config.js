module.exports = {
	project: {
		ios: {},
		android: {}, // grouped into "project"
	  },
	assets: ["./assets/fonts/"],
	dependencies: {
		'react-native-notifications': {
			platforms: {
				android: null
			}
		},
		'react-native-keyboard-input': {
			platforms: {
				android: null
			}
		},
		'@nozbe/watermelondb': {
			platforms: {
				android: null,
				ios: null
			}
		}
	}
};
