import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';
import {
	type ShouldStartLoadRequest,
	type WebViewErrorEvent,
	type WebViewHttpErrorEvent,
	type WebViewMessageEvent,
	type WebViewOpenWindowEvent
} from 'react-native-webview/lib/WebViewTypes';

import i18n from '../../i18n';
import { userAgent } from '../../lib/constants/userAgent';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { isIOS } from '../../lib/methods/helpers';
import { isConferenceUrl, isSecureHttpUrl } from '../../lib/methods/helpers/isConferenceUrl';
import log from '../../lib/methods/helpers/log';
import openLink from '../../lib/methods/helpers/openLink';
import { random } from '../../lib/methods/helpers/random';
import { setServerCookies } from '../../lib/methods/helpers/setServerCookies';
import { getUserSelector } from '../../selectors/login';
import { useTheme } from '../../theme';
import Button from '../Button';
import { buildConferenceBridgeScript, parseConferenceBridgeMessage } from './bridge';

type IConferenceWebView = {
	url: string;
	onClose: () => void;
	onOpenLink: (path: string) => void;
};

const ConferenceWebView = ({ url, onClose, onOpenLink }: IConferenceWebView) => {
	const { id: userId, token } = useAppSelector(state => getUserSelector(state));
	const server = useAppSelector(state => state.server.server);
	const { theme, colors } = useTheme();
	const webviewRef = useRef<WebView>(null);
	const loaded = useRef(false);
	const [failed, setFailed] = useState(false);

	const credentialsAllowed = isSecureHttpUrl(server) && isSecureHttpUrl(url);
	const [cookiesSet, setCookiesSet] = useState(!credentialsAllowed);
	// Android exposes the bridge to child frames, so a cross-origin provider frame could forge
	// the source. The token lives only in the main frame's closure, which cross-origin frames
	// cannot read, so they cannot mint a message that parses.
	const bridgeToken = useMemo(() => random(32), []);

	useEffect(() => {
		if (!credentialsAllowed) {
			setCookiesSet(true);
			return;
		}

		let cancelled = false;

		setCookiesSet(false);
		setServerCookies(server, { id: userId, token })
			.catch(log)
			.finally(() => {
				if (!cancelled) {
					setCookiesSet(true);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [server, userId, token, credentialsAllowed]);

	useEffect(() => {
		activateKeepAwake();
		return () => {
			deactivateKeepAwake();
		};
	}, []);

	const injectedJavaScriptBeforeContentLoaded = useMemo(
		() => (credentialsAllowed ? buildConferenceBridgeScript({ userId, token, server, bridgeToken }) : 'true;'),
		[userId, token, server, bridgeToken, credentialsAllowed]
	);

	const onMessage = useCallback(
		({ nativeEvent }: WebViewMessageEvent) => {
			const message = parseConferenceBridgeMessage(nativeEvent.data, bridgeToken);

			switch (message?.type) {
				case 'close':
					onClose();
					break;
				case 'openInMainWindow':
					onOpenLink(message.path);
					break;
				default:
					break;
			}
		},
		[onClose, onOpenLink, bridgeToken]
	);

	const onShouldStartLoadWithRequest = useCallback(
		({ url: target, isTopFrame }: ShouldStartLoadRequest) => {
			// iOS reports subframe navigations here too; cancelling one would tear a cross-origin
			// provider embed out of the page.
			if (!isTopFrame || isConferenceUrl(target, server)) {
				return true;
			}

			openLink(target, theme);
			return false;
		},
		[server, theme]
	);

	const onOpenWindow = useCallback(({ nativeEvent }: WebViewOpenWindowEvent) => openLink(nativeEvent.targetUrl, theme), [theme]);

	const onError = useCallback(({ nativeEvent }: WebViewErrorEvent) => {
		log(new Error(`ConferenceWebView failed to load: ${nativeEvent.description}`));
		setFailed(true);
	}, []);

	const onHttpError = useCallback(
		({ nativeEvent }: WebViewHttpErrorEvent) => {
			// Android reports subresources here too, and a request failing mid-call is the page's
			// problem to handle. Only a conference page that never loaded is ours.
			if (loaded.current || !isConferenceUrl(nativeEvent.url, server)) {
				return;
			}
			log(new Error(`ConferenceWebView got HTTP ${nativeEvent.statusCode}`));
			setFailed(true);
		},
		[server]
	);

	const onLoadEnd = useCallback(() => {
		loaded.current = true;
	}, []);

	const onRetry = useCallback(() => {
		setFailed(false);
		loaded.current = false;
		webviewRef.current?.reload();
	}, []);

	if (failed) {
		return (
			<View style={[styles.webview, styles.loading]}>
				<Text style={[styles.errorText, { color: colors.fontWhite }]}>{i18n.t('error-init-video-conf')}</Text>
				<Button title={i18n.t('Try_again')} onPress={onRetry} style={styles.errorButton} />
				<Button title={i18n.t('Close')} type='secondary' onPress={onClose} style={styles.errorButton} />
			</View>
		);
	}

	if (!cookiesSet) {
		return (
			<View style={[styles.webview, styles.loading]}>
				<ActivityIndicator />
			</View>
		);
	}

	return (
		<WebView
			ref={webviewRef}
			source={credentialsAllowed ? { uri: url, headers: { Cookie: `rc_uid=${userId}; rc_token=${token}` } } : { uri: url }}
			injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
			onMessage={onMessage}
			onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
			onOpenWindow={onOpenWindow}
			onError={onError}
			onHttpError={onHttpError}
			onLoadEnd={onLoadEnd}
			style={styles.webview}
			userAgent={userAgent}
			javaScriptEnabled
			domStorageEnabled
			allowsInlineMediaPlayback
			mediaCapturePermissionGrantType='grant'
			mediaPlaybackRequiresUserAction={isIOS}
			sharedCookiesEnabled
		/>
	);
};

const styles = StyleSheet.create({
	webview: { flex: 1, backgroundColor: 'rgb(31,33,38)' },
	loading: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
	errorText: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
	errorButton: { alignSelf: 'stretch' }
});

export default ConferenceWebView;
