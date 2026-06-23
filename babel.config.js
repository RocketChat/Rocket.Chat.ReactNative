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
		// Inline Drizzle migration .sql files as string literals so the migrator can run them
		// (works in Metro and Jest; expo-sqlite has no native .sql loader).
		['babel-plugin-inline-import', { extensions: ['.sql'] }],
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
