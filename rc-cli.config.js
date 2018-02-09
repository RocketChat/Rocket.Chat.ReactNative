const blacklist = require('metro/src/blacklist'); // eslint-disable-line

module.exports = {
	getBlacklistRE() {
		return blacklist([/react-native\/local-cli\/core\/__fixtures__.*/]);
	}
};
