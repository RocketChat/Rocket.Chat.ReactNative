/**
 * Normalize a Rocket.Chat server base URL for deep linking and VoIP host comparison.
 * Matches the historical behavior in `app/sagas/deepLinking.js` (`handleOpen` host handling).
 */
export function normalizeDeepLinkingServerHost(rawHost: string): string {
	let host = rawHost;
	if (!host) {
		return '';
	}
	if (!/^(http|https)/.test(host)) {
		if (/^localhost(:\d+)?/.test(host)) {
			host = `http://${host}`;
		} else {
			host = `https://${host}`;
		}
	} else {
		host = host.replace('http://', 'https://');
	}
	if (host.slice(-1) === '/') {
		host = host.slice(0, host.length - 1);
	}
	return host;
}
