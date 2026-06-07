import parseQuery from './parseQuery';

const parseDeepLinking = (url: string) => {
	if (url) {
		url = url.replace(/rocketchat:\/\/|https:\/\/go.rocket.chat\//, '');
		const regex = /^(room|auth|invite|shareextension)\?/;
		const match = url.match(regex);
		if (match) {
			const matchedPattern = match[1];
			const query = url.replace(regex, '').trim();

			if (query) {
				const parsedQuery = parseQuery(query);
				// OAuth redirect returned from the native auth session
				// (rocketchat://auth?credentialToken=...&credentialSecret=...).
				// Tag it 'oauth' so the deep-linking saga completes the login.
				if (matchedPattern === 'auth' && parsedQuery?.credentialToken) {
					return {
						...parsedQuery,
						type: 'oauth'
					};
				}
				return {
					...parsedQuery,
					type: matchedPattern === 'shareextension' ? matchedPattern : parsedQuery?.type
				};
			}
		}
	}

	// Return null if the URL doesn't match or is not valid
	return null;
};

export default parseDeepLinking;
