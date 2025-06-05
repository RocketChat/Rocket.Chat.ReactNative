module.exports = {
	testPathIgnorePatterns: ['e2e', 'node_modules'],
	transformIgnorePatterns: [
		'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@storybook|react-native-gesture-handler|@gorhom)'
	],
	preset: './jest.preset.js',
	coverageDirectory: './coverage/',
	collectCoverage: true,
	moduleNameMapper: {
		'.+\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
		'.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
		'react-native-gesture-handler': '<rootDir>/__mocks__/react-native-gesture-handler.js'
	},
	setupFilesAfterEnv: ['./jest.setup.js'],
	projects: [
		{
			displayName: 'app',
			testMatch: ['<rootDir>/app/**/*.test.{js,jsx,ts,tsx}'],
			transformIgnorePatterns: [
				'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
			]
		},
		{
			displayName: 'storybook-snapshots',
			testMatch: ['<rootDir>/.storybook/snapshots/**/*.test.{js,jsx,ts,tsx}'],
			setupFilesAfterEnv: ['<rootDir>/.storybook/test-setup.tsx'],
			transformIgnorePatterns: [
				'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@storybook|react-native-gesture-handler|@gorhom)'
			],
			moduleNameMapper: {
				'.+\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
				'.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
				'react-native-gesture-handler': '<rootDir>/__mocks__/react-native-gesture-handler.js'
			}
		}
	]
};
