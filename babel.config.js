module.exports = {
	presets: ['babel-preset-expo'],
	plugins: [
        'babel-plugin-react-compiler',
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
