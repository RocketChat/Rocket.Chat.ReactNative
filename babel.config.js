module.exports = {
	presets: ['module:metro-react-native-babel-preset'],
	plugins: [
		['@babel/plugin-proposal-decorators', { legacy: true }],
		'react-native-reanimated/plugin',
		[
			'babel-plugin-root-import',
			{
				rootPathSuffix: 'app'
			}
		]
	],
	env: {
		production: {
			plugins: ['transform-remove-console']
		}
	}
};
