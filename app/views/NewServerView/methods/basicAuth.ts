import { Base64 } from 'js-base64';
import parse from 'url-parse';

import { BASIC_AUTH_KEY, setBasicAuth } from '../../../lib/methods/helpers/fetch';
import UserPreferences from '../../../lib/methods/userPreferences';

const basicAuth = (server: string, text: string) => {
	try {
		const parsedUrl = parse(text, true);
		if (parsedUrl.auth.length) {
			const credentials = Base64.encode(parsedUrl.auth);
			UserPreferences.setString(`${BASIC_AUTH_KEY}-${server}`, credentials);
			setBasicAuth(credentials);
		}
	} catch {
		// do nothing
	}
};

export default basicAuth;
