import { Base64 } from 'js-base64';
import parse from 'url-parse';

import UserPreferences from '~/lib/methods/userPreferences';
import { getBasicAuthKey } from '~/lib/constants/keys';

const basicAuth = (server: string, text: string) => {
	try {
		const parsedUrl = parse(text, true);
		if (parsedUrl.auth.length) {
			const credentials = Base64.encode(parsedUrl.auth);
			UserPreferences.setString(getBasicAuthKey(server), credentials);
		}
	} catch {
		// do nothing
	}
};

export default basicAuth;
