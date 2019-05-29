/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

module.exports = {
	transformer: {
		getTransformOptions: () => ({
			transform: {
				experimentalImportSupport: true,
				inlineRequires: true
			}
		})
	}
};
