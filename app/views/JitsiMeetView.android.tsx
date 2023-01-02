import React from 'react';
import { BackHandler, NativeEventSubscription } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import { isAppInstalled, openAppWithUri } from 'react-native-send-intent';
import WebView from 'react-native-webview';
import { WebViewMessage, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';

import { IBaseScreen } from '../definitions';
import { events, logEvent } from '../lib/methods/helpers/log';
import { Services } from '../lib/services';
import { ChatsStackParamList } from '../stacks/types';
import { withTheme } from '../theme';

const JITSI_INTENT = 'org.jitsi.meet';

type TJitsiMeetViewProps = IBaseScreen<ChatsStackParamList, 'JitsiMeetView'>;

class JitsiMeetView extends React.Component<TJitsiMeetViewProps> {
	private rid: string;
	private url: string;
	private videoConf: boolean;
	private jitsiTimeout: number | null;
	private backHandler!: NativeEventSubscription;

	constructor(props: TJitsiMeetViewProps) {
		super(props);
		this.rid = props.route.params?.rid;
		this.url = props.route.params?.url;
		this.videoConf = !!props.route.params?.videoConf;
		this.jitsiTimeout = null;
	}

	componentDidMount() {
		const { route, navigation } = this.props;
		isAppInstalled(JITSI_INTENT)
			.then(function (isInstalled) {
				if (isInstalled) {
					const callUrl = route.params.url.replace(/^https?:\/\//, '').split('#')[0];
					openAppWithUri(`intent://${callUrl}#Intent;scheme=${JITSI_INTENT};package=${JITSI_INTENT};end`)
						.then(() => navigation.pop())
						.catch(() => {});
				}
			})
			.catch(() => {});
		this.onConferenceJoined();
		this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
		activateKeepAwake();
	}

	componentWillUnmount() {
		logEvent(this.videoConf ? events.LIVECHAT_VIDEOCONF_TERMINATE : events.JM_CONFERENCE_TERMINATE);
		if (this.jitsiTimeout && !this.videoConf) {
			BackgroundTimer.clearInterval(this.jitsiTimeout);
			this.jitsiTimeout = null;
			BackgroundTimer.stopBackgroundTimer();
		}
		this.backHandler.remove();
		deactivateKeepAwake();
	}

	// Jitsi Update Timeout needs to be called every 10 seconds to make sure
	// call is not ended and is available to web users.
	onConferenceJoined = () => {
		logEvent(this.videoConf ? events.LIVECHAT_VIDEOCONF_JOIN : events.JM_CONFERENCE_JOIN);
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
		const { navigation, route } = this.props;
		const jitsiRoomId = route.params.url
			?.split(/^https?:\/\//)[1]
			?.split('#')[0]
			?.split('/')[1];
		if ((jitsiRoomId && !webViewState.url.includes(jitsiRoomId)) || webViewState.url.includes('close')) {
			navigation.pop();
		}
	};

	render() {
		return (
			<WebView
				source={{ uri: `${this.url}&config.disableDeepLinking=true` }}
				onMessage={({ nativeEvent }) => this.onNavigationStateChange(nativeEvent)}
				onNavigationStateChange={this.onNavigationStateChange}
				style={{ flex: 1 }}
				javaScriptEnabled
				domStorageEnabled
				mediaPlaybackRequiresUserAction={false}
			/>
		);
	}
}

export default withTheme(JitsiMeetView);
