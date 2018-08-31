import React from 'react';
import PropTypes from 'prop-types';
import { WebView, Platform } from 'react-native';
import { connect } from 'react-redux';

import RocketChat from '../lib/rocketchat';
import I18n from '../i18n';
import { iconsMap } from '../Icons';

const userAgentAndroid = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1';
const userAgent = Platform.OS === 'ios' ? 'UserAgent' : userAgentAndroid;

@connect(state => ({
	server: state.server.server
}))
export default class OAuthView extends React.PureComponent {
	static navigatorButtons = {
		leftButtons: [{
			id: 'close',
			title: I18n.t('Close'),
			icon: Platform.OS === 'android' ? iconsMap.close : undefined
		}]
	}

	static propTypes = {
		navigator: PropTypes.object,
		oAuthUrl: PropTypes.string,
		server: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.redirectRegex = new RegExp(`(?=.*(${ props.server }))(?=.*(credentialToken))(?=.*(credentialSecret))`, 'g');
		props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	onNavigatorEvent(event) {
		const { navigator } = this.props;
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'close') {
				navigator.dismissModal();
			}
		}
	}

	login = async(params) => {
		try {
			await RocketChat.login(params);
		} catch (e) {
			console.warn(e);
		}
	}

	render() {
		return (
			<WebView
				source={{ uri: this.props.oAuthUrl }}
				userAgent={userAgent}
				onNavigationStateChange={(webViewState) => {
					const url = decodeURIComponent(webViewState.url);
					if (this.redirectRegex.test(url)) {
						const parts = url.split('#');
						const credentials = JSON.parse(parts[1]);
						this.login({ oauth: { ...credentials } });
						this.props.navigator.dismissModal();
					}
				}}
			/>
		);
	}
}
