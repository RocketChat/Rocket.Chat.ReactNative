const addProtocol = (url: string): string => {
	if (!url.toLowerCase().startsWith('http')) {
		return `https://${url.replace('//', '')}`;
	}
	return url;
};

export default addProtocol;
