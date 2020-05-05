import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native-webview';
import { connect } from 'react-redux';
import parse from 'url-parse';

import RocketChat from '../lib/rocketchat';
import { isIOS } from '../utils/deviceInfo';
import { CloseModalButton } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import ActivityIndicator from '../containers/ActivityIndicator';
import { withTheme } from '../theme';
import { themedHeader } from '../utils/navigation';
import debounce from '../utils/debounce';

const userAgent = isIOS
	? 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1'
	: 'Mozilla/5.0 (Linux; Android 6.0.1; SM-G920V Build/MMB29K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.98 Mobile Safari/537.36';

class AuthenticationWebView extends React.PureComponent {
	static navigationOptions = ({ navigation, screenProps }) => {
		const authType = navigation.getParam('authType', 'oauth');
		return {
			...themedHeader(screenProps.theme),
			headerLeft: <CloseModalButton navigation={navigation} />,
			title: authType === 'saml' || authType === 'cas' ? 'SSO' : 'OAuth'
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			logging: false,
			loading: false
		};
		this.authType = props.navigation.getParam('authType', 'oauth');
		this.redirectRegex = new RegExp(`(?=.*(${ props.server }))(?=.*(credentialToken))(?=.*(credentialSecret))`, 'g');
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

	onNavigationStateChange = (webViewState) => {
		const url = decodeURIComponent(webViewState.url);
		if (this.authType === 'saml' || this.authType === 'cas') {
			const { navigation } = this.props;
			const ssoToken = navigation.getParam('ssoToken');
			const parsedUrl = parse(url, true);
			// ticket -> cas / validate & saml_idp_credentialToken -> saml
			if (parsedUrl.pathname?.includes('validate') || parsedUrl.query?.ticket || parsedUrl.query?.saml_idp_credentialToken) {
				let payload;
				if (this.authType === 'saml') {
					const token = parsedUrl.query?.saml_idp_credentialToken || ssoToken;
					const credentialToken = { credentialToken: token };
					payload = { ...credentialToken, saml: true };
				} else {
					payload = { cas: { credentialToken: ssoToken } };
				}
				this.debouncedLogin(payload);
			}
		}

		if (this.authType === 'oauth') {
			if (this.redirectRegex.test(url)) {
				const parts = url.split('#');
				const credentials = JSON.parse(parts[1]);
				this.login({ oauth: { ...credentials } });
			}
		}
	}

	render() {
		const { loading } = this.state;
		const { navigation, theme } = this.props;
		const uri = navigation.getParam('url');
		return (
			<>
				<StatusBar theme={theme} />
				<WebView
					source={{ uri }}
					userAgent={userAgent}
					onNavigationStateChange={this.onNavigationStateChange}
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
	server: state.server.server
});

export default connect(mapStateToProps)(withTheme(AuthenticationWebView));
