module.exports = {
	presets: ['babel-preset-expo'],
	plugins: [
		['@babel/plugin-proposal-decorators', { legacy: true }],
		'@babel/plugin-transform-named-capturing-groups-regex',
		['module:react-native-dotenv'],
		'react-native-worklets/plugin'
	],
	overrides: [
		{
			// Babel merges an override's plugins with the root list instead of replacing them,
			// so the compiler must live here with `exclude` to stay out of jest setup and tests.
			exclude: /(jest\.setup\.js|\.(test|spec)\.(js|jsx|ts|tsx))$/,
			plugins: [
				[
					'babel-plugin-react-compiler',
					{
						compilationMode: 'infer'
					}
				]
			]
		}
	],
	env: {
		// Jest's CommonJS runtime rejects the SDK's dynamic `import('../drivers/ddp')`
		// as long as babel-preset-expo (caller "metro") leaves it native. Rewrite it to
		// a synchronous require in the test env only.
		test: {
			plugins: ['@babel/plugin-transform-dynamic-import']
		},
		production: {
			plugins: ['transform-remove-console']
		}
	}
};
