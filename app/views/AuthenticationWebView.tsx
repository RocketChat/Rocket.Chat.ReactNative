import { RouteProp } from '@react-navigation/core';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useState } from 'react';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { WebViewMessage } from 'react-native-webview/lib/WebViewTypes';
import parse from 'url-parse';

import ActivityIndicator from '../containers/ActivityIndicator';
import * as HeaderButton from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { ICredentials } from '../definitions';
import { userAgent } from '../lib/constants';
import { useAppSelector } from '../lib/hooks';
import { useDebounce } from '../lib/methods/helpers';
import { Services } from '../lib/services';
import { OutsideModalParamList } from '../stacks/types';

// iframe uses a postMessage to send the token to the client
// We'll handle this sending the token to the hash of the window.location
// https://docs.rocket.chat/guides/developer-guides/iframe-integration/authentication#iframe-url
// https://github.com/react-native-community/react-native-webview/issues/24#issuecomment-540130141
const injectedJavaScript = `
window.addEventListener('message', ({ data }) => {
	if (typeof data === 'object') {
		window.location.hash = JSON.stringify(data);
	}
});
function wrap(fn) {
	return function wrapper() {
		var res = fn.apply(this, arguments);
		window.ReactNativeWebView.postMessage(window.location.href);
		return res;
	}
}
history.pushState = wrap(history.pushState);
history.replaceState = wrap(history.replaceState);
window.addEventListener('popstate', function() {
	window.ReactNativeWebView.postMessage(window.location.href);
});
`;

const AuthenticationWebView = () => {
	const [logging, setLogging] = useState(false);
	const [loading, setLoading] = useState(false);

	const navigation = useNavigation<NativeStackNavigationProp<OutsideModalParamList, 'AuthenticationWebView'>>();
	const {
		params: { authType, url, ssoToken }
	} = useRoute<RouteProp<OutsideModalParamList, 'AuthenticationWebView'>>();

	const { Accounts_Iframe_api_method, Accounts_Iframe_api_url, server } = useAppSelector(state => ({
		server: state.server.server,
		Accounts_Iframe_api_url: state.settings.Accounts_Iframe_api_url as string,
		Accounts_Iframe_api_method: state.settings.Accounts_Iframe_api_method as string
	}));

	const oauthRedirectRegex = new RegExp(`(?=.*(${server}))(?=.*(credentialToken))(?=.*(credentialSecret))`, 'g');
	const iframeRedirectRegex = new RegExp(`(?=.*(${server}))(?=.*(event|loginToken|token))`, 'g');

	// Force 3s delay so the server has time to evaluate the token
	const debouncedLogin = useDebounce((params: ICredentials) => login(params), 3000);

	const login = (params: ICredentials) => {
		if (logging) {
			return;
		}
		setLogging(true);
		try {
			Services.loginOAuthOrSso(params);
		} catch (e) {
			console.warn(e);
		}
		setLogging(false);
		navigation.pop();
	};

	const tryLogin = useDebounce(
		async () => {
			const data = await fetch(Accounts_Iframe_api_url, { method: Accounts_Iframe_api_method }).then(response => response.json());
			const resume = data?.login || data?.loginToken;
			if (resume) {
				login({ resume });
			}
		},
		3000,
		{ leading: true }
	);

	const onNavigationStateChange = (webViewState: WebViewNavigation | WebViewMessage) => {
		const url = decodeURIComponent(webViewState.url);
		if (authType === 'saml' || authType === 'cas') {
			const parsedUrl = parse(url, true);
			// ticket -> cas / validate & saml_idp_credentialToken -> saml
			if (parsedUrl.pathname?.includes('validate') || parsedUrl.query?.ticket || parsedUrl.query?.saml_idp_credentialToken) {
				let payload: ICredentials;
				if (authType === 'saml') {
					const token = parsedUrl.query?.saml_idp_credentialToken || ssoToken;
					const credentialToken = { credentialToken: token };
					payload = { ...credentialToken, saml: true };
				} else {
					payload = { cas: { credentialToken: ssoToken } };
				}
				debouncedLogin(payload);
			}
		}

		if (authType === 'oauth') {
			if (oauthRedirectRegex.test(url)) {
				const parts = url.split('#');
				const credentials = JSON.parse(parts[1]);
				debouncedLogin({ oauth: { ...credentials } });
			}
		}

		if (authType === 'iframe') {
			if (iframeRedirectRegex.test(url)) {
				const parts = url.split('#');
				const credentials = JSON.parse(parts[1]);
				switch (credentials.event) {
					case 'try-iframe-login':
						tryLogin();
						break;
					case 'login-with-token':
						debouncedLogin({ resume: credentials.token || credentials.loginToken });
						break;
					default:
					// Do nothing
				}
			}
		}
	};

	const isIframe = authType === 'iframe';

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => <HeaderButton.CloseModal />,
			title: ['saml', 'cas', 'iframe'].includes(authType) ? 'SSO' : 'OAuth'
		});
	}, [authType, navigation]);

	return (
		<>
			<StatusBar />
			<WebView
				source={{ uri: url }}
				userAgent={userAgent}
				// https://github.com/react-native-community/react-native-webview/issues/24#issuecomment-540130141
				onMessage={({ nativeEvent }) => onNavigationStateChange(nativeEvent)}
				onNavigationStateChange={onNavigationStateChange}
				injectedJavaScript={isIframe ? injectedJavaScript : undefined}
				onLoadStart={() => setLoading(true)}
				onLoadEnd={() => setLoading(false)}
			/>
			{loading ? <ActivityIndicator size='large' absolute /> : null}
		</>
	);
};

export default AuthenticationWebView;
