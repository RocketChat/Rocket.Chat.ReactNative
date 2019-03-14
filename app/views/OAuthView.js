import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native';
import { connect } from 'react-redux';

import RocketChat from '../lib/rocketchat';
import { isIOS } from '../utils/deviceInfo';
import { CloseModalButton } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';

const userAgentAndroid = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1';
const userAgent = isIOS ? 'UserAgent' : userAgentAndroid;

@connect(state => ({
	server: state.server.server
}))
export default class OAuthView extends React.PureComponent {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: <CloseModalButton navigation={navigation} />,
		title: 'OAuth'
	})

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			logging: false
		};
		this.redirectRegex = new RegExp(`(?=.*(${ props.server }))(?=.*(credentialToken))(?=.*(credentialSecret))`, 'g');
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
			await RocketChat.loginOAuth(params);
		} catch (e) {
			console.warn(e);
		}
		this.setState({ logging: false });
		this.dismiss();
	}

	render() {
		const { navigation } = this.props;
		const oAuthUrl = navigation.getParam('oAuthUrl');
		return (
			<React.Fragment>
				<StatusBar />
				<WebView
					source={{ uri: oAuthUrl }}
					userAgent={userAgent}
					onNavigationStateChange={(webViewState) => {
						const url = decodeURIComponent(webViewState.url);
						if (this.redirectRegex.test(url)) {
							const parts = url.split('#');
							const credentials = JSON.parse(parts[1]);
							this.login({ oauth: { ...credentials } });
						}
					}}
				/>
			</React.Fragment>
		);
	}
}
