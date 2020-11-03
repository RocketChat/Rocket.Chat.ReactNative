import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native-webview';
import { connect } from 'react-redux';
import parse from 'url-parse';

import RocketChat from '../lib/rocketchat';
import { isIOS } from '../utils/deviceInfo';
import StatusBar from '../containers/StatusBar';
import ActivityIndicator from '../containers/ActivityIndicator';
import { withTheme } from '../theme';
import debounce from '../utils/debounce';
import * as HeaderButton from '../containers/HeaderButton';

const userAgent = isIOS
	? 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1'
	: 'Mozilla/5.0 (Linux; Android 6.0.1; SM-G920V Build/MMB29K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.98 Mobile Safari/537.36';

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

class AuthenticationWebView extends React.PureComponent {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		server: PropTypes.string,
		Accounts_Iframe_api_url: PropTypes.bool,
		Accounts_Iframe_api_method: PropTypes.bool,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			logging: false,
			loading: false
		};
		this.oauthRedirectRegex = new RegExp(`(?=.*(${ props.server }))(?=.*(credentialToken))(?=.*(credentialSecret))`, 'g');
		this.iframeRedirectRegex = new RegExp(`(?=.*(${ props.server }))(?=.*(event|loginToken|token))`, 'g');
	}

	componentWillUnmount() {
		if (this.debouncedLogin && this.debouncedLogin.stop) {
			this.debouncedLogin.stop();
		}
	}

	dismiss = () => {
		const { navigation } = this.props;
		navigation.pop();
	}

	login = async(params) => {
		const { logging } = this.state;
		if (logging) {
			return;
		}

		this.setState({ logging: true });

		try {
			await RocketChat.loginOAuthOrSso(params);
		} catch (e) {
			console.warn(e);
		}
		this.setState({ logging: false });
		this.dismiss();
	}

	// eslint-disable-next-line react/sort-comp
	debouncedLogin = debounce(params => this.login(params), 3000);

	tryLogin = debounce(async() => {
		const { Accounts_Iframe_api_url, Accounts_Iframe_api_method } = this.props;
		const data = await fetch(Accounts_Iframe_api_url, { method: Accounts_Iframe_api_method }).then(response => response.json());
		const resume = data?.login || data?.loginToken;
		if (resume) {
			this.login({ resume });
		}
	}, 3000, true)

	onNavigationStateChange = (webViewState) => {
		const url = decodeURIComponent(webViewState.url);
		const { route } = this.props;
		const { authType } = route.params;
		if (authType === 'saml' || authType === 'cas') {
			const { ssoToken } = route.params;
			const parsedUrl = parse(url, true);
			// ticket -> cas / validate & saml_idp_credentialToken -> saml
			if (parsedUrl.pathname?.includes('validate') || parsedUrl.query?.ticket || parsedUrl.query?.saml_idp_credentialToken) {
				let payload;
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
				this.login({ oauth: { ...credentials } });
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
						this.login({ resume: credentials.token || credentials.loginToken });
						break;
					default:
						// Do nothing
				}
			}
		}
	}

	render() {
		const { loading } = this.state;
		const { route, theme } = this.props;
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
				{ loading ? <ActivityIndicator size='large' theme={theme} absolute /> : null }
			</>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server.server,
	Accounts_Iframe_api_url: state.settings.Accounts_Iframe_api_url,
	Accounts_Iframe_api_method: state.settings.Accounts_Iframe_api_method
});

AuthenticationWebView.navigationOptions = ({ route, navigation }) => {
	const { authType } = route.params;
	return {
		headerLeft: () => <HeaderButton.CloseModal navigation={navigation} />,
		title: ['saml', 'cas', 'iframe'].includes(authType) ? 'SSO' : 'OAuth'
	};
};

export default connect(mapStateToProps)(withTheme(AuthenticationWebView));
