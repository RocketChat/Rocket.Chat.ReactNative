import React from 'react';
import { BackHandler, NativeEventSubscription, PermissionsAndroid } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import { isAppInstalled, openAppWithData } from 'react-native-send-intent';
import WebView from 'react-native-webview';
import { WebViewMessage, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { connect } from 'react-redux';

import RCActivityIndicator from '../containers/ActivityIndicator';
import { IApplicationState, IBaseScreen, IUser } from '../definitions';
import { events, logEvent } from '../lib/methods/helpers/log';
import { Services } from '../lib/services';
import { getUserSelector } from '../selectors/login';
import { ChatsStackParamList } from '../stacks/types';
import { withTheme } from '../theme';

const JITSI_INTENT = 'org.jitsi.meet';

const formatUrl = (url: string, baseUrl: string, uriSize: number, avatarAuthURLFragment: string) =>
	`${baseUrl}/avatar/${url}?format=png&width=${uriSize}&height=${uriSize}${avatarAuthURLFragment}`;

interface IJitsiMeetViewState {
	userInfo: {
		displayName: string;
		avatar: string;
	};
	loading: boolean;
}

interface IJitsiMeetViewProps extends IBaseScreen<ChatsStackParamList, 'JitsiMeetView'> {
	baseUrl: string;
	user: IUser;
}

class JitsiMeetView extends React.Component<IJitsiMeetViewProps, IJitsiMeetViewState> {
	private rid: string;
	private url: string;
	private videoConf: boolean;
	private jitsiTimeout: number | null;
	private backHandler!: NativeEventSubscription;

	constructor(props: IJitsiMeetViewProps) {
		super(props);
		this.rid = props.route.params?.rid;
		this.url = props.route.params?.url;
		this.videoConf = !!props.route.params?.videoConf;
		this.jitsiTimeout = null;

		const { user, baseUrl } = props;
		const { name, id: userId, token, username } = user;
		const avatarAuthURLFragment = `&rc_token=${token}&rc_uid=${userId}`;
		const avatar = formatUrl(username, baseUrl, 100, avatarAuthURLFragment);
		this.state = {
			userInfo: {
				displayName: name as string,
				avatar
			},
			loading: true
		};
	}

	componentDidMount() {
		const { route, navigation } = this.props;

		isAppInstalled(JITSI_INTENT)
			.then(function (isInstalled) {
				if (!isInstalled) {
					PermissionsAndroid.requestMultiple([
						PermissionsAndroid.PERMISSIONS.CAMERA,
						PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
					]);
					return;
				}
				navigation.pop();
				openAppWithData(JITSI_INTENT, route.params?.url);
			})
			.catch(() => {});

		setTimeout(() => {
			this.setState({ loading: false });
		}, 1000);
		this.onConferenceJoined();
		this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
	}

	componentWillUnmount() {
		logEvent(this.videoConf ? events.LIVECHAT_VIDEOCONF_TERMINATE : events.JM_CONFERENCE_TERMINATE);
		if (this.jitsiTimeout && !this.videoConf) {
			BackgroundTimer.clearInterval(this.jitsiTimeout);
			this.jitsiTimeout = null;
			BackgroundTimer.stopBackgroundTimer();
		}
		this.backHandler.remove();
	}

	// Jitsi Update Timeout needs to be called every 10 seconds to make sure
	// call is not ended and is available to web users.
	onConferenceJoined = () => {
		logEvent(this.videoConf ? events.LIVECHAT_VIDEOCONF_JOIN : events.JM_CONFERENCE_JOIN);
		this.setState({ loading: false });
		if (this.rid && !this.videoConf) {
			Services.updateJitsiTimeout(this.rid).catch((e: unknown) => console.log(e));
			if (this.jitsiTimeout) {
				BackgroundTimer.clearInterval(this.jitsiTimeout);
				BackgroundTimer.stopBackgroundTimer();
				this.jitsiTimeout = null;
			}
			this.jitsiTimeout = BackgroundTimer.setInterval(() => {
				Services.updateJitsiTimeout(this.rid).catch((e: unknown) => console.log(e));
			}, 10000);
		}
	};

	onNavigationStateChange = (webViewState: WebViewNavigation | WebViewMessage) => {
		const { navigation } = this.props;
		if (webViewState.url.includes('close')) {
			navigation.pop();
		}
	};

	render() {
		const { loading } = this.state;
		return (
			<>
				<WebView
					source={{ uri: `${this.url}&config.disableDeepLinking=true` }}
					onMessage={({ nativeEvent }) => this.onNavigationStateChange(nativeEvent)}
					onNavigationStateChange={this.onNavigationStateChange}
					style={{ flex: loading ? 0 : 1 }}
					javaScriptEnabled
					domStorageEnabled
				/>
				{loading ? <RCActivityIndicator absolute size='large' /> : null}
			</>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	baseUrl: state.server.server
});

export default connect(mapStateToProps)(withTheme(JitsiMeetView));
