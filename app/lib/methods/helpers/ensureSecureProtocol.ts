// If the link does not have the protocol at the beginning, we are inserting https as the default,
// since by convention the most used is the secure protocol, with the same behavior as the web.
const ensureSecureProtocol = (url: string): string => {
	// Check if URL has a protocol by looking for a valid URI scheme (RFC 3986)
	if (!url.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/)) {
		return `https://${url.replace('//', '')}`;
	}
	return url;
};

export default ensureSecureProtocol;
