import React from 'react';
import PropTypes from 'prop-types';
import { WebView, Platform, Dimensions } from 'react-native';
import { connect } from 'react-redux';
import { Navigation } from 'react-native-navigation';

import RocketChat from '../lib/rocketchat';
import I18n from '../i18n';

const userAgentAndroid = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1';
const userAgent = Platform.OS === 'ios' ? 'UserAgent' : userAgentAndroid;

@connect(state => ({
	server: state.server.server
}))
export default class OAuthView extends React.PureComponent {
	static options() {
		return {
			topBar: {
				leftButtons: [{
					id: 'cancel',
					icon: Platform.OS === 'android' ? { uri: 'back', scale: Dimensions.get('window').scale } : undefined,
					text: Platform.OS === 'ios' ? I18n.t('Cancel') : undefined
				}]
			}
		};
	}

	static propTypes = {
		componentId: PropTypes.string,
		oAuthUrl: PropTypes.string,
		server: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.redirectRegex = new RegExp(`(?=.*(${ props.server }))(?=.*(credentialToken))(?=.*(credentialSecret))`, 'g');
		Navigation.events().bindComponent(this);
	}

	navigationButtonPressed = ({ buttonId }) => {
		if (buttonId === 'cancel') {
			this.dismiss();
		}
	}

	dismiss = () => {
		const { componentId } = this.props;
		Navigation.dismissModal(componentId);
	}

	login = async(params) => {
		try {
			await RocketChat.login(params);
		} catch (e) {
			console.warn(e);
		}
	}

	render() {
		const { oAuthUrl } = this.props;
		return (
			<WebView
				source={{ uri: oAuthUrl }}
				userAgent={userAgent}
				onNavigationStateChange={(webViewState) => {
					const url = decodeURIComponent(webViewState.url);
					if (this.redirectRegex.test(url)) {
						const parts = url.split('#');
						const credentials = JSON.parse(parts[1]);
						this.login({ oauth: { ...credentials } });
						this.dismiss();
					}
				}}
			/>
		);
	}
}
