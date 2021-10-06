module.exports = {
	presets: ['module:metro-react-native-babel-preset'],
	plugins: [['@babel/plugin-proposal-decorators', { legacy: true }], 'react-native-reanimated/plugin'],
	env: {
		production: {
			plugins: ['transform-remove-console']
		}
	}
};
