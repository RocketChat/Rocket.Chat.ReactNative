const appductConfigurations = process.env.RUNNING_E2E_TESTS === 'true' ? ['Debug', 'Release'] : ['Debug'];

module.exports = {
	dependencies: {
		'@appduct/react-native': {
			platforms: {
				ios: { configurations: appductConfigurations }
			}
		}
	}
};
