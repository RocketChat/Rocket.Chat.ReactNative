import * as uri from 'uri-js';

import { isIOS } from './helpers';

export const serializeAsciiUrl = (url: string): string => {
	let newUrl = url;
	const ascii = /^[ -~\t\n\r]+$/;
	if (isIOS && !ascii.test(newUrl)) {
		newUrl = uri.serialize(uri.parse(url));
		newUrl = newUrl.charAt(newUrl.length - 1) === '/' ? newUrl.slice(0, -1) : newUrl;
	}
	return newUrl;
};
