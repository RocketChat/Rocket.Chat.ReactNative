import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useState, type ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
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
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Video_call'),
			headerLeft: () => <HeaderButton.CloseModal testID='video-conf-webview-close' onPress={() => navigation.goBack()} />
		});
	}, [navigation]);

	useEffect(() => {
		activateKeepAwake();
		return () => {
			deactivateKeepAwake();
		};
	}, []);

	return (
		<SafeAreaView style={styles.container} testID='video-conf-webview'>
			<WebView
				source={{ uri: url }}
				onLoadEnd={() => setLoading(false)}
				style={[styles.webview, { marginBottom: bottom }]}
				userAgent={userAgent}
				javaScriptEnabled
				domStorageEnabled
				allowsInlineMediaPlayback
				mediaCapturePermissionGrantType='grant'
				mediaPlaybackRequiresUserAction={isIOS}
			/>
			{loading ? (
				<View style={styles.loading}>
					<ActivityIndicator />
				</View>
			) : null}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1 },
	webview: { flex: 1 },
	loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }
});

export default VideoConfWebView;
