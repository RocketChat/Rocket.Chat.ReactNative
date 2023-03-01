// If the link does not have the protocol at the beginning, we are inserting https as the default,
// since by conversion the most used is the secure protocol, with the same behavior as the web.
const addProtocol = (url: string): string => {
	if (!url.toLowerCase().startsWith('http')) {
		return `https://${url.replace('//', '')}`;
	}
	return url;
};

export default addProtocol;
