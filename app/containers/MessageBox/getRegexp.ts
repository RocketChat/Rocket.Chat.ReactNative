import { MENTIONS_TRACKING_TYPE_USERS } from './constants';

// Regexp to select query string from the message to replace it with the suggestion
const getRegexp = (trackingType: String): any => {
	if (trackingType === MENTIONS_TRACKING_TYPE_USERS) {
		// Selects query text after '@' for all languages while mentioning a user
		return /([^@p{L}]+)$/im;
	}
	return /([a-z0-9._-]+)$/im;
};

export default getRegexp;
