import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView, { type WebViewNavigation } from 'react-native-webview';
import { type WebViewMessageEvent, type WebViewOpenWindowEvent } from 'react-native-webview/lib/WebViewTypes';

import { userAgent } from '../../lib/constants/userAgent';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { isIOS } from '../../lib/methods/helpers';
import { isConferenceUrl } from '../../lib/methods/helpers/isConferenceUrl';
import log from '../../lib/methods/helpers/log';
import openLink from '../../lib/methods/helpers/openLink';
import { setServerCookies } from '../../lib/methods/helpers/setServerCookies';
import { getUserSelector } from '../../selectors/login';
import { buildConferenceBridgeScript, parseConferenceBridgeMessage } from './bridge';

type IConferenceWebView = {
	url: string;
	onClose: () => void;
	onOpenLink: (path: string) => void;
};

const ConferenceWebView = ({ url, onClose, onOpenLink }: IConferenceWebView) => {
	const { id: userId, token } = useAppSelector(state => getUserSelector(state));
	const server = useAppSelector(state => state.server.server);

	const [cookiesSet, setCookiesSet] = useState(false);

	useEffect(() => {
		let cancelled = false;

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
	}, [server, userId, token]);

	useEffect(() => {
		activateKeepAwake();
		return () => {
			deactivateKeepAwake();
		};
	}, []);

	const injectedJavaScriptBeforeContentLoaded = useMemo(
		() => buildConferenceBridgeScript({ userId, token, server }),
		[userId, token, server]
	);

	const onMessage = useCallback(
		({ nativeEvent }: WebViewMessageEvent) => {
			const message = parseConferenceBridgeMessage(nativeEvent.data);

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
		[onClose, onOpenLink]
	);

	const onShouldStartLoadWithRequest = useCallback(
		({ url: target }: WebViewNavigation) => {
			if (isConferenceUrl(target, server)) {
				return true;
			}

			openLink(target);
			return false;
		},
		[server]
	);

	const onOpenWindow = useCallback(({ nativeEvent }: WebViewOpenWindowEvent) => openLink(nativeEvent.targetUrl), []);

	if (!cookiesSet) {
		return (
			<View style={[styles.webview, styles.loading]}>
				<ActivityIndicator />
			</View>
		);
	}

	return (
		<WebView
			source={{ uri: url, headers: { Cookie: `rc_uid=${userId}; rc_token=${token}` } }}
			injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
			onMessage={onMessage}
			onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
			onOpenWindow={onOpenWindow}
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
	loading: { alignItems: 'center', justifyContent: 'center' }
});

export default ConferenceWebView;
