import parse from 'url-parse';

import { serializeAsciiUrl } from '../../../lib/methods/serializeAsciiUrl';

const completeUrl = (url: string) => {
	const parsedUrl = parse(url, true);
	if (parsedUrl.auth.length) {
		url = parsedUrl.origin;
	}

	url = url && url.replace(/\s/g, '');

	if (/^(\w|[0-9-_]){3,}$/.test(url) && /^(htt(ps?)?)|(loca((l)?|(lh)?|(lho)?|(lhos)?|(lhost:?\d*)?)$)/.test(url) === false) {
		url = `${url}.rocket.chat`;
	}

	if (/^(https?:\/\/)?(((\w|[0-9-_])+(\.(\w|[0-9-_])+)+)|localhost)(:\d+)?$/.test(url)) {
		if (/^localhost(:\d+)?/.test(url)) {
			url = `http://${url}`;
		} else if (/^https?:\/\//.test(url) === false) {
			url = `https://${url}`;
		}
	}
	return serializeAsciiUrl(url.replace(/\/+$/, '').replace(/\\/g, '/'));
};

export default completeUrl;
