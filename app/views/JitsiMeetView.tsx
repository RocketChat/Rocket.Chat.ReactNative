import React from 'react';
import { BackHandler, NativeEventSubscription, StyleSheet } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import JitsiMeet, { JitsiMeetView as RNJitsiMeetView } from 'react-native-jitsi-meet';
import { connect } from 'react-redux';
import WebView from 'react-native-webview';
import { WebViewMessage, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';

import ActivityIndicator from '../containers/ActivityIndicator';
import { IApplicationState, IBaseScreen, IUser } from '../definitions';
import { isAndroid, isIOS } from '../lib/methods/helpers';
import { events, logEvent } from '../lib/methods/helpers/log';
import { Services } from '../lib/services';
import { getUserSelector } from '../selectors/login';
import { ChatsStackParamList } from '../stacks/types';
import { withTheme } from '../theme';

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
		const { route } = this.props;
		const { userInfo } = this.state;

		setTimeout(() => {
			this.setState({ loading: false });
		}, 1000);

		if (isIOS) {
			setTimeout(() => {
				const onlyAudio = route.params?.onlyAudio ?? false;
				if (onlyAudio) {
					JitsiMeet.audioCall(this.url, userInfo);
				} else {
					JitsiMeet.call(this.url, userInfo);
				}
			}, 1000);
		}
		this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
	}

	componentWillUnmount() {
		logEvent(events.JM_CONFERENCE_TERMINATE);
		if (this.jitsiTimeout && !this.videoConf) {
			BackgroundTimer.clearInterval(this.jitsiTimeout);
			this.jitsiTimeout = null;
			BackgroundTimer.stopBackgroundTimer();
		}
		this.backHandler.remove();
		if (isIOS) {
			JitsiMeet.endCall();
		}
	}

	onConferenceWillJoin = () => {
		this.setState({ loading: false });
	};

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

	onConferenceTerminated = () => {
		logEvent(this.videoConf ? events.LIVECHAT_VIDEOCONF_TERMINATE : events.JM_CONFERENCE_TERMINATE);
		const { navigation } = this.props;
		// fix to go back when the call ends
		setTimeout(() => {
			JitsiMeet.endCall();
			navigation.pop();
		}, 200);
	};

	onNavigationStateChange = (webViewState: WebViewNavigation | WebViewMessage) => {
		const { navigation } = this.props;
		if (!isIOS && webViewState.url.includes('close')) {
			navigation.pop();
		}
	};

	render() {
		const { userInfo, loading } = this.state;
		const { route } = this.props;
		const onlyAudio = route.params?.onlyAudio ?? false;
		const options = isAndroid ? { url: this.url, userInfo, audioOnly: onlyAudio } : null;

		return (
			<>
				{isIOS ? (
					<RNJitsiMeetView
						onConferenceWillJoin={this.onConferenceWillJoin}
						onConferenceTerminated={this.onConferenceTerminated}
						onConferenceJoined={this.onConferenceJoined}
						style={StyleSheet.absoluteFill}
						options={options}
					/>
				) : (
					<WebView
						source={{ uri: `${this.url}&config.disableDeepLinking=true` }}
						onMessage={({ nativeEvent }) => this.onNavigationStateChange(nativeEvent)}
						onNavigationStateChange={this.onNavigationStateChange}
						style={{ flex: loading ? 0 : 1 }}
						mediaPlaybackRequiresUserAction={false}
						javaScriptEnabled
						domStorageEnabled
					/>
				)}
				{loading ? <ActivityIndicator /> : null}
			</>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	baseUrl: state.server.server
});

export default connect(mapStateToProps)(withTheme(JitsiMeetView));
