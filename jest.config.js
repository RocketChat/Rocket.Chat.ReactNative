module.exports = {
	preset: 'react-native',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	testPathIgnorePatterns: [
		'e2e',
		'node_modules'
	],
	coverageDirectory: './coverage/',
	collectCoverage: true,
	moduleNameMapper: {
		'.+\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
		'.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js'
	},
	transform: {
		'^.+\\.js$': '<rootDir>/node_modules/react-native/jest/preprocessor.js',
		'^.+\\.ts$': '<rootDir>/node_modules/react-native/jest/preprocessor.js',
		'^.+\\.tsx$': '<rootDir>/node_modules/react-native/jest/preprocessor.js'
	}
};
