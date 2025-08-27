module.exports = {
	presets: ['babel-preset-expo'],
	plugins: [
		['@babel/plugin-proposal-decorators', { legacy: true }],
		'react-native-reanimated/plugin',
		'@babel/plugin-transform-named-capturing-groups-regex',
		['module:react-native-dotenv'],
		['transform-inline-environment-variables', { include: ['RUNNING_E2E_TESTS'] }]
	],
	env: {
		production: {
			plugins: ['transform-remove-console']
		}
	}
};
