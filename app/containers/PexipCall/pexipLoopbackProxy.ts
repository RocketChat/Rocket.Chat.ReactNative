import { NativeModules } from 'react-native';

import { isIOS } from '~/lib/methods/helpers';
import log from '~/lib/methods/helpers/log';

interface IPexipProxyModule {
	start(upstreamOrigin: string): Promise<string>;
	stop(): void;
}

const getModule = (): IPexipProxyModule | undefined => (isIOS ? NativeModules.PexipProxy : undefined);

// NSURLError server certificate range: -1200 (secure connection failed) to -1204 (certificate not yet valid)
export const isTlsError = (code: unknown): boolean => typeof code === 'number' && code <= -1200 && code >= -1204;

export const getHttpsOrigin = (url: string): string | null => /^https:\/\/[^/?#]+/i.exec(url)?.[0] ?? null;

// Origins whose certificate WKWebView already rejected this session; later calls go straight through the proxy.
const untrustedOrigins = new Set<string>();

export const markUntrustedOrigin = (url: string): void => {
	const origin = getHttpsOrigin(url);
	if (origin) untrustedOrigins.add(origin.toLowerCase());
};

export const isUntrustedOrigin = (url: string): boolean => {
	const origin = getHttpsOrigin(url);
	return !!getModule() && !!origin && untrustedOrigins.has(origin.toLowerCase());
};

/**
 * Serves `url` through the in-app loopback proxy and returns the `http://127.0.0.1:<port>` URL to load instead.
 * Returns null when the proxy is unavailable (Android, non-https URL, native failure).
 */
export const startPexipLoopbackProxy = async (url: string): Promise<string | null> => {
	const proxy = getModule();
	const origin = getHttpsOrigin(url);
	if (!proxy || !origin) return null;
	try {
		const localOrigin = await proxy.start(origin);
		return `${localOrigin}${url.slice(origin.length)}`;
	} catch (e) {
		log(e);
		return null;
	}
};

export const stopPexipLoopbackProxy = (): void => {
	getModule()?.stop();
};
