import React from 'react';
import { BackHandler, NativeEventSubscription, PermissionsAndroid } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import { isAppInstalled, openAppWithData } from 'react-native-send-intent';
import WebView from 'react-native-webview';
import { WebViewMessage, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';

import RCActivityIndicator from '../containers/ActivityIndicator';
import { IBaseScreen } from '../definitions';
import { events, logEvent } from '../lib/methods/helpers/log';
import { Services } from '../lib/services';
import { ChatsStackParamList } from '../stacks/types';
import { withTheme } from '../theme';

const JITSI_INTENT = 'org.jitsi.meet';

interface IJitsiMeetViewState {
	loading: boolean;
}

type TJitsiMeetViewProps = IBaseScreen<ChatsStackParamList, 'JitsiMeetView'>;

class JitsiMeetView extends React.Component<TJitsiMeetViewProps, IJitsiMeetViewState> {
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

		this.state = {
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

export default withTheme(JitsiMeetView);
