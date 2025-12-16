module.exports = {
	presets: ['babel-preset-expo'],
	plugins: [
		['react-native-unistyles/plugin', { root: 'app' }],
		[
			'babel-plugin-react-compiler',
			{
				compilationMode: 'annotation'
			}
		],
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
