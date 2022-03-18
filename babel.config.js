module.exports = {
	presets: ['module:metro-react-native-babel-preset'],
	plugins: [
		['@babel/plugin-proposal-decorators', { legacy: true }],
		'react-native-reanimated/plugin',
		[
			'module-resolver',
			{
				extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
				alias: {
					'@app': './app'
				}
			}
		]
	],
	env: {
		production: {
			plugins: ['transform-remove-console']
		}
	}
};
