/*
	Extract hostname from url
	url = 'https://chat.cortexflex.org/method'
	hostname = 'chat.cortexflex.org'
*/
export const extractHostname = (url: string): string => {
	let hostname;

	if (url.indexOf('//') > -1) {
		[, , hostname] = url.split('/');
	} else {
		[hostname] = url.split('/');
	}
	[hostname] = hostname.split(':');
	[hostname] = hostname.split('?');

	return hostname;
};
