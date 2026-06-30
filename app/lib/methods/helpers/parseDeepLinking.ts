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
				return {
					...parsedQuery,
					type: matchedPattern === 'shareextension' ? matchedPattern : parsedQuery?.type
				};
			}
		}
	}

	return null;
};

export default parseDeepLinking;
