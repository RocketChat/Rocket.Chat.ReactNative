module.exports = {
	presets: ['module:@react-native/babel-preset'],
	plugins: [
		['@babel/plugin-proposal-decorators', { legacy: true }],
		'react-native-reanimated/plugin',
		'@babel/plugin-transform-named-capturing-groups-regex',
		['module:react-native-dotenv']
	],
	env: {
		production: {
			plugins: ['transform-remove-console']
		}
	}
};
