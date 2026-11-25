const getAliasConfig = require('./config/import-aliases');

/** @type {import('react-native-worklets/plugin').PluginOptions} */
const workletsPluginOptions = {
	bundleMode: true,
	importForwarding: { moduleNames: ['@rocket.chat/message-parser'] }
};

module.exports = {
	presets: [['babel-preset-expo', { worklets: false, reanimated: false }]],
	plugins: [
		['module-resolver', { alias: getAliasConfig().babel }],
		['@babel/plugin-proposal-decorators', { legacy: true }],
		'@babel/plugin-transform-named-capturing-groups-regex',
		['transform-inline-environment-variables', { include: ['RUNNING_E2E_TESTS', 'USE_STORYBOOK'] }],
		['react-native-worklets/plugin', workletsPluginOptions]
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
		production: {
			plugins: ['transform-remove-console']
		}
	}
};
