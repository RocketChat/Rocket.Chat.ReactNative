import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Linking, SafeAreaView } from 'react-native';
import WebView from 'react-native-webview';

import { userAgent } from '../../lib/constants';
import { isIOS } from '../../lib/methods/helpers';
import { getRoomIdFromJitsiCallUrl } from '../../lib/methods/helpers/getRoomIdFromJitsiCall';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { endVideoConfTimer, initVideoConfTimer } from '../../lib/methods/videoConfTimer';
import { ChatsStackParamList } from '../../stacks/types';
import JitsiAuthModal from './JitsiAuthModal';

const JitsiMeetView = (): React.ReactElement => {
	const {
		params: { rid, url, videoConf }
	} = useRoute<RouteProp<ChatsStackParamList, 'JitsiMeetView'>>();
	const { goBack } = useNavigation();

	const [authModal, setAuthModal] = useState(false);

	const handleJitsiApp = useCallback(async () => {
		const callUrl = url.replace(/^https?:\/\//, '');
		try {
			await Linking.openURL(`org.jitsi.meet://${callUrl}`);
			goBack();
		} catch (error) {
			// As the jitsi app was not opened, disable the backhandler on android
			BackHandler.addEventListener('hardwareBackPress', () => true);
		}
	}, [goBack, url]);

	const onConferenceJoined = useCallback(() => {
		logEvent(videoConf ? events.LIVECHAT_VIDEOCONF_JOIN : events.JM_CONFERENCE_JOIN);
		if (rid && !videoConf) {
			initVideoConfTimer(rid);
		}
	}, [rid, videoConf]);

	const onNavigationStateChange = useCallback(
		webViewState => {
			const roomId = getRoomIdFromJitsiCallUrl(url);
			if (webViewState.url.includes('auth-static')) {
				setAuthModal(true);
				return false;
			}
			if ((roomId && !webViewState.url.includes(roomId)) || webViewState.url.includes('close')) {
				if (isIOS) {
					if (webViewState.navigationType) {
						goBack();
					}
				} else {
					goBack();
				}
			}
			return true;
		},
		[goBack, url]
	);

	useEffect(() => {
		handleJitsiApp();
		onConferenceJoined();
		activateKeepAwake();

		return () => {
			logEvent(videoConf ? events.LIVECHAT_VIDEOCONF_TERMINATE : events.JM_CONFERENCE_TERMINATE);
			if (!videoConf) endVideoConfTimer();
			deactivateKeepAwake();
		};
	}, [handleJitsiApp, onConferenceJoined, videoConf]);

	const callUrl = `${url}${url.includes('#config') ? '&' : '#'}config.disableDeepLinking=true`;

	return (
		<SafeAreaView style={{ flex: 1 }}>
			{authModal && <JitsiAuthModal setAuthModal={setAuthModal} callUrl={callUrl} />}
			<WebView
				source={{ uri: callUrl.replace(/"/g, "'") }}
				onNavigationStateChange={onNavigationStateChange}
				onShouldStartLoadWithRequest={onNavigationStateChange}
				style={{ flex: 1, backgroundColor: 'rgb(62,62,62)' }}
				userAgent={userAgent}
				javaScriptEnabled
				domStorageEnabled
				allowsInlineMediaPlayback
				mediaCapturePermissionGrantType={'grant'}
				mediaPlaybackRequiresUserAction={isIOS}
			/>
		</SafeAreaView>
	);
};

export default JitsiMeetView;
