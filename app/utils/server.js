/*
	Extract hostname from url
	url = 'https://open.rocket.chat/method'
	hostname = 'open.rocket.chat'
*/
export const extractHostname = (url) => {
	let hostname;

	if (url.indexOf('//') > -1) {
		[,, hostname] = url.split('/');
	} else {
		[hostname] = url.split('/');
	}
	[hostname] = hostname.split(':');
	[hostname] = hostname.split('?');

	return hostname;
};

export const completeUrl = (url) => {
	url = url && url.replace(/\s/g, '');

	if (/^(\w|[0-9-_]){3,}$/.test(url)
		&& /^(htt(ps?)?)|(loca((l)?|(lh)?|(lho)?|(lhos)?|(lhost:?\d*)?)$)/.test(url) === false) {
		url = `${ url }.rocket.chat`;
	}

	if (/^(https?:\/\/)?(((\w|[0-9-_])+(\.(\w|[0-9-_])+)+)|localhost)(:\d+)?$/.test(url)) {
		if (/^localhost(:\d+)?/.test(url)) {
			url = `http://${ url }`;
		} else if (/^https?:\/\//.test(url) === false) {
			url = `https://${ url }`;
		}
	}

	return url.replace(/\/+$/, '').replace(/\\/g, '/');
};
