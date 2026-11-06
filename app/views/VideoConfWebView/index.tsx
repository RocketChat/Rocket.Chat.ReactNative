import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import { useLayoutEffect, type ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { userAgent } from '~/lib/constants/userAgent';
import { headerLeftCloseModal } from '~/lib/methods/helpers/navigation/headerActions';
import { isIOS } from '~/lib/methods/helpers';
import { type InsideStackParamList } from '~/stacks/types';

const VideoConfWebView = (): ReactElement => {
	const {
		params: { url }
	} = useRoute<RouteProp<InsideStackParamList, 'VideoConfWebView'>>();
	const navigation = useNavigation();
	const { bottom } = useSafeAreaInsets();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Video_call'),
			...headerLeftCloseModal(navigation, 'video-conf-webview-close')
		});
	}, [navigation]);

	useKeepAwake();

	return (
		<SafeAreaView testID='video-conf-webview'>
			<WebView
				source={{ uri: url }}
				startInLoadingState
				style={[styles.webview, { marginBottom: bottom }]}
				userAgent={userAgent}
				domStorageEnabled
				allowsInlineMediaPlayback
				mediaCapturePermissionGrantType='grantIfSameHostElseDeny'
				mediaPlaybackRequiresUserAction={isIOS}
			/>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	webview: { flex: 1 }
});

export default VideoConfWebView;
