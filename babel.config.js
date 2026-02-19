module.exports = {
	presets: ['babel-preset-expo'],
	plugins: [
		[
			'babel-plugin-react-compiler',
			{
				compilationMode: 'annotation'
			}
		],
		['@babel/plugin-proposal-decorators', { legacy: true }],
		'@babel/plugin-transform-named-capturing-groups-regex',
		['module:react-native-dotenv'],
		'react-native-worklets/plugin'
	],
	env: {
		production: {
			plugins: ['transform-remove-console']
		}
	}
};
