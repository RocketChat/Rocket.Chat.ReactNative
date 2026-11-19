const jestExpo = require('jest-expo/jest-preset.js');

module.exports = {
	...jestExpo,
	testEnvironment: require.resolve('@react-native/jest-preset/jest/react-native-env.js')
};
