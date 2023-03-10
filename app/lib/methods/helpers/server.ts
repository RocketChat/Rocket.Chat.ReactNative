/*
	Extract hostname from url
	url = 'https://open.rocket.chat/method'
	hostname = 'open.rocket.chat'
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
