import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, StyleSheet } from 'react-native';
import RocketChat from '../lib/rocketchat';
import { isIOS } from '../utils/deviceInfo';
import { CloseModalButton } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';

const userAgent = isIOS
	? 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1'
	: 'Mozilla/5.0 (Linux; Android 6.0.1; SM-G920V Build/MMB29K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.98 Mobile Safari/537.36';

const styles = StyleSheet.create({
	loading: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

export default class SSOView extends React.PureComponent {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: <CloseModalButton navigation={navigation} />,
		title: 'SSO'
	})

	static propTypes = {
		navigation: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.state = {
			logging: false,
			loading: false
		};
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

	render() {
		const { navigation } = this.props;
		const { loading } = this.state;
		const ssoUrl = navigation.getParam('ssoUrl');
		const ssoToken = navigation.getParam('ssoToken');
		return (
			<React.Fragment>
				<StatusBar />
				<WebView
					useWebKit
					source={{ uri: ssoUrl }}
					userAgent={userAgent}
					onNavigationStateChange={(webViewState) => {
						const url = decodeURIComponent(webViewState.url);
						if (url.includes('ticket') || url.includes('validate')) {
							const payload = `{ "saml": true, "credentialToken": "${ ssoToken }" }`;
							// We need to set a timeout when the login is done with SSO in order to make it work on our side.
							// It is actually due to the SSO server processing the response.
							setTimeout(() => {
								this.login(JSON.parse(payload));
							}, 3000);
						}
					}}
					onLoadStart={() => {
						this.setState({ loading: true });
					}}

					onLoadEnd={() => {
						this.setState({ loading: false });
					}}
				/>
				{ loading ? <ActivityIndicator size='large' style={styles.loading} /> : null }
			</React.Fragment>
		);
	}
}
