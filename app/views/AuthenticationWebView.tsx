import React from 'react';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { connect } from 'react-redux';
import parse from 'url-parse';
import { StackNavigationProp } from '@react-navigation/stack';
import { WebViewMessage } from 'react-native-webview/lib/WebViewTypes';
import { RouteProp } from '@react-navigation/core';

import { OutsideModalParamList } from '../stacks/types';
import StatusBar from '../containers/StatusBar';
import ActivityIndicator from '../containers/ActivityIndicator';
import { userAgent } from '../lib/constants';
import { debounce } from '../lib/methods/helpers';
import * as HeaderButton from '../containers/HeaderButton';
import { Services } from '../lib/services';
import { IApplicationState, ICredentials } from '../definitions';

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

interface INavigationOption {
	navigation: StackNavigationProp<OutsideModalParamList, 'AuthenticationWebView'>;
	route: RouteProp<OutsideModalParamList, 'AuthenticationWebView'>;
}

interface IAuthenticationWebView extends INavigationOption {
	server: string;
	Accounts_Iframe_api_url: string;
	Accounts_Iframe_api_method: string;
}

interface IState {
	logging: boolean;
	loading: boolean;
}

class AuthenticationWebView extends React.PureComponent<IAuthenticationWebView, IState> {
	private oauthRedirectRegex: RegExp;
	private iframeRedirectRegex: RegExp;

	static navigationOptions = ({ route, navigation }: INavigationOption) => {
		const { authType } = route.params;
		return {
			headerLeft: () => <HeaderButton.CloseModal navigation={navigation} />,
			title: ['saml', 'cas', 'iframe'].includes(authType) ? 'SSO' : 'OAuth'
		};
	};

	constructor(props: IAuthenticationWebView) {
		super(props);
		this.state = {
			logging: false,
			loading: false
		};
		this.oauthRedirectRegex = new RegExp(`(?=.*(${props.server}))(?=.*(credentialToken))(?=.*(credentialSecret))`, 'g');
		this.iframeRedirectRegex = new RegExp(`(?=.*(${props.server}))(?=.*(event|loginToken|token))`, 'g');
	}

	componentWillUnmount() {
		if (this.debouncedLogin && this.debouncedLogin.stop) {
			this.debouncedLogin.stop();
		}
	}

	dismiss = () => {
		const { navigation } = this.props;
		navigation.pop();
	};

	login = (params: ICredentials) => {
		const { logging } = this.state;
		if (logging) {
			return;
		}

		this.setState({ logging: true });

		try {
			Services.loginOAuthOrSso(params);
		} catch (e) {
			console.warn(e);
		}
		this.setState({ logging: false });
		this.dismiss();
	};

	// Force 3s delay so the server has time to evaluate the token
	debouncedLogin = debounce((params: ICredentials) => this.login(params), 3000);

	tryLogin = debounce(
		async () => {
			const { Accounts_Iframe_api_url, Accounts_Iframe_api_method } = this.props;
			const data = await fetch(Accounts_Iframe_api_url, { method: Accounts_Iframe_api_method }).then(response => response.json());
			const resume = data?.login || data?.loginToken;
			if (resume) {
				this.login({ resume });
			}
		},
		3000,
		true
	);

	onNavigationStateChange = (webViewState: WebViewNavigation | WebViewMessage) => {
		const url = decodeURIComponent(webViewState.url);
		const { route } = this.props;
		const { authType } = route.params;
		if (authType === 'saml' || authType === 'cas') {
			const { ssoToken } = route.params;
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
				this.debouncedLogin(payload);
			}
		}

		if (authType === 'oauth') {
			if (this.oauthRedirectRegex.test(url)) {
				const parts = url.split('#');
				const credentials = JSON.parse(parts[1]);
				this.debouncedLogin({ oauth: { ...credentials } });
			}
		}

		if (authType === 'iframe') {
			if (this.iframeRedirectRegex.test(url)) {
				const parts = url.split('#');
				const credentials = JSON.parse(parts[1]);
				switch (credentials.event) {
					case 'try-iframe-login':
						this.tryLogin();
						break;
					case 'login-with-token':
						this.debouncedLogin({ resume: credentials.token || credentials.loginToken });
						break;
					default:
					// Do nothing
				}
			}
		}
	};

	render() {
		const { loading } = this.state;
		const { route } = this.props;
		const { url, authType } = route.params;
		const isIframe = authType === 'iframe';

		return (
			<>
				<StatusBar />
				<WebView
					source={{ uri: url }}
					userAgent={userAgent}
					// https://github.com/react-native-community/react-native-webview/issues/24#issuecomment-540130141
					onMessage={({ nativeEvent }) => this.onNavigationStateChange(nativeEvent)}
					onNavigationStateChange={this.onNavigationStateChange}
					injectedJavaScript={isIframe ? injectedJavaScript : undefined}
					onLoadStart={() => {
						this.setState({ loading: true });
					}}
					onLoadEnd={() => {
						this.setState({ loading: false });
					}}
				/>
				{loading ? <ActivityIndicator size='large' absolute /> : null}
			</>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	server: state.server.server as string,
	Accounts_Iframe_api_url: state.settings.Accounts_Iframe_api_url as string,
	Accounts_Iframe_api_method: state.settings.Accounts_Iframe_api_method as string
});

export default connect(mapStateToProps)(AuthenticationWebView);
