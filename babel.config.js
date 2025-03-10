module.exports = {
	presets: ['module:@react-native/babel-preset'],
	plugins: [
		['@babel/plugin-proposal-decorators', { legacy: true }],
		'react-native-reanimated/plugin',
		'@babel/plugin-transform-named-capturing-groups-regex',
		['module:react-native-dotenv'],
		[
			'module-resolver',
			{
			  root: ['.'],
			  extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.android.js', '.ios.js', '.android.ts', '.ios.ts', '.android.tsx', '.ios.tsx', '.android.jsx', '.ios.jsx'],
			  alias: {
				'@': './app',
				'@actions': './app/actions',
				'@containers': './app/containers',
				'@definitions': './app/definitions',
				'@ee': './app/ee',
				'@i18n': './app/i18n',
				'@lib': './app/lib',
				'@reducers': './app/reducers',
				'@sagas': './app/sagas',
				'@selectors': './app/selectors',
				'@stacks': './app/stacks',
				'@statics': './app/statics',
				'@views': './app/views'
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
