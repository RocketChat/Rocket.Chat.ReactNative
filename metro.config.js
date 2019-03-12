/* eslint-disable require-await */
module.exports = {
	transformer: {
		getTransformOptions: async() => ({
			transform: {
				experimentalImportSupport: false,
				inlineRequires: false
			}
		})
	}
};
