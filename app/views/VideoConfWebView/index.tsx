import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import { useLayoutEffect, type ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { userAgent } from '~/lib/constants/userAgent';
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
			headerLeft: () => <HeaderButton.CloseModal testID='video-conf-webview-close' />
		});
	}, [navigation]);

	useKeepAwake();

	return (
		<SafeAreaView style={styles.container} testID='video-conf-webview'>
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
	container: { flex: 1 },
	webview: { flex: 1 }
});

export default VideoConfWebView;
