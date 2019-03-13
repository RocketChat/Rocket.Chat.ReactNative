/* eslint-disable require-await */
module.exports = {
	transformer: {
		getTransformOptions: async() => ({
			transform: {
				experimentalImportSupport: true,
				inlineRequires: true
			}
		})
	}
};
