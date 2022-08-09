const jestRN = require('@testing-library/react-native/jest-preset/index.js');
const jestExpo = require('jest-expo/jest-preset.js');

module.exports = {
	...jestRN,
	...jestExpo
};
