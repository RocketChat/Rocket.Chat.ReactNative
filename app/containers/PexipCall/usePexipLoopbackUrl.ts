import { useEffect, useState } from 'react';

import {
	isTlsError,
	isUntrustedOrigin,
	markUntrustedOrigin,
	startPexipLoopbackProxy,
	stopPexipLoopbackProxy
} from './pexipLoopbackProxy';

interface IPexipLoopbackCall {
	callId: string;
	url: string;
}

/**
 * iOS: WKWebView cannot be told to accept an untrusted certificate, so the page is re-served from loopback.
 * `loading` is true while the proxy starts; `url` is null when no call is active.
 */
export const usePexipLoopbackUrl = (call?: IPexipLoopbackCall | null) => {
	const callId = call?.callId;
	const callUrl = call?.url;
	const [rejectedCallId, setRejectedCallId] = useState<string | null>(null);
	// url null: the proxy could not start, so the WebView error is shown as is
	const [proxy, setProxy] = useState<{ callId: string; url: string | null } | null>(null);
	const proxyState = proxy && proxy.callId === callId ? proxy : null;
	const needsProxy = !!callId && !!callUrl && (rejectedCallId === callId || isUntrustedOrigin(callUrl));

	useEffect(() => {
		if (!needsProxy || !callId || !callUrl) return;
		let cancelled = false;
		startPexipLoopbackProxy(callUrl).then(url => {
			if (!cancelled) setProxy({ callId, url });
		});
		return () => {
			cancelled = true;
			stopPexipLoopbackProxy();
			setProxy(null);
		};
	}, [needsProxy, callId, callUrl]);

	const onTlsError = (code: unknown): boolean => {
		if (!callId || !callUrl || proxyState || !isTlsError(code)) return false;
		markUntrustedOrigin(callUrl);
		setRejectedCallId(callId);
		return true;
	};

	return {
		url: proxyState?.url ?? callUrl ?? null,
		loading: needsProxy && !proxyState,
		onTlsError
	};
};
