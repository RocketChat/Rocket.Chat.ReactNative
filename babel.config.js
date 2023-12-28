module.exports = {
	presets: ['module:metro-react-native-babel-preset'],
	plugins: [
		['@babel/plugin-proposal-decorators', { legacy: true }],
		'react-native-reanimated/plugin',
		'@babel/plugin-transform-named-capturing-groups-regex',
		['module:react-native-dotenv'],
		['@babel/plugin-transform-flow-strip-types', { allowDeclareFields: true }]
	],
	env: {
		production: {
			plugins: ['transform-remove-console']
		}
	}
};
