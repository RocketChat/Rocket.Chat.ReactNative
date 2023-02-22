import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import React from 'react';
import { BackHandler, NativeEventSubscription } from 'react-native';
import { isAppInstalled, openAppWithUri } from 'react-native-send-intent';
import WebView from 'react-native-webview';
import { WebViewMessage, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';

import { IBaseScreen } from '../definitions';
import { events, logEvent } from '../lib/methods/helpers/log';
import { endVideoConfTimer, initVideoConfTimer } from '../lib/methods/videoConfTimer';
import { ChatsStackParamList } from '../stacks/types';
import { withTheme } from '../theme';

const JITSI_INTENT = 'org.jitsi.meet';

type TJitsiMeetViewProps = IBaseScreen<ChatsStackParamList, 'JitsiMeetView'>;

class JitsiMeetView extends React.Component<TJitsiMeetViewProps> {
	private rid: string;
	private url: string;
	private videoConf: boolean;
	private backHandler!: NativeEventSubscription;

	constructor(props: TJitsiMeetViewProps) {
		super(props);
		this.rid = props.route.params?.rid;
		this.url = props.route.params?.url;
		this.videoConf = !!props.route.params?.videoConf;
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
		if (!this.videoConf) {
			endVideoConfTimer();
		}
		this.backHandler.remove();
		deactivateKeepAwake();
	}

	// Jitsi Update Timeout needs to be called every 10 seconds to make sure
	// call is not ended and is available to web users.
	onConferenceJoined = () => {
		logEvent(this.videoConf ? events.LIVECHAT_VIDEOCONF_JOIN : events.JM_CONFERENCE_JOIN);
		if (this.rid && !this.videoConf) {
			initVideoConfTimer(this.rid);
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
				source={{ uri: `${this.url}${this.url.includes('#config') ? '&' : '#'}config.disableDeepLinking=true` }}
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
