import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { BackHandler, Keyboard, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { useShallow } from 'zustand/react/shallow';

import ActivityIndicator from '~/containers/ActivityIndicator';
import { userAgent } from '~/lib/constants/userAgent';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { usePexipCallStore } from '~/lib/services/videoConf/usePexipCallStore';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { PexipCallTopBar } from './PexipCallTopBar';
import { isTlsError } from './pexipLoopbackProxy';
import { usePexipLoopbackUrl } from './usePexipLoopbackUrl';
import { usePexipPresenceLease } from './usePexipPresenceLease';
import { usePexipSplitLayout } from './usePexipSplitLayout';

const KEEP_AWAKE_TAG = 'pexip-call';

const PexipCall = () => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();
	const isMasterDetail = useMasterDetail();
	const { isLandscape, size: splitSize } = usePexipSplitLayout();
	const { call, layout, split, expand, leave } = usePexipCallStore(
		useShallow(state => ({
			call: state.call,
			layout: state.layout,
			split: state.split,
			expand: state.expand,
			leave: state.leave
		}))
	);
	const server = useAppSelector(state => state.server.server);
	const isPersistentChatEnabled = useAppSelector(state => !!state.settings.VideoConf_Enable_Persistent_Chat);
	usePexipPresenceLease(call?.callId, isPersistentChatEnabled);
	const loopback = usePexipLoopbackUrl(call);
	const isSplit = layout === 'split';
	const isFull = !!call && !isSplit;

	useEffect(() => {
		if (call && call.server !== server) leave();
	}, [call, server, leave]);

	useEffect(() => {
		if (!call) return;
		activateKeepAwakeAsync(KEEP_AWAKE_TAG);
		return () => {
			deactivateKeepAwake(KEEP_AWAKE_TAG);
		};
	}, [call]);

	useEffect(() => {
		if (isFull) Keyboard.dismiss();
	}, [isFull]);

	const openChat = async () => {
		split();
		if (!call?.rid) return;
		const subscription = await getSubscriptionByRoomId(call.rid);
		if (subscription) goRoom({ item: subscription, isMasterDetail });
	};

	useEffect(() => {
		if (!isFull) return;
		const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
			openChat();
			return true;
		});
		return () => subscription.remove();
	});

	if (!call) return null;

	const splitStyle = {
		top: insets.top,
		left: isLandscape ? insets.left : 0,
		width: isLandscape ? splitSize - insets.left : width,
		height: isLandscape ? height - insets.top - insets.bottom : splitSize
	};

	const loadingView = (
		<View style={[StyleSheet.absoluteFill, styles.webview]}>
			<ActivityIndicator absolute size='large' color={colors.fontWhite} />
		</View>
	);

	return (
		<View
			style={[styles.container, isSplit ? splitStyle : StyleSheet.absoluteFill]}
			testID={isSplit ? 'pexip-call-split' : 'pexip-call'}>
			<PexipCallTopBar
				rid={call.rid}
				startedAt={call.startedAt}
				isSplit={isSplit}
				onLeave={leave}
				onExpand={expand}
				onOpenChat={openChat}
			/>
			<View style={[styles.webviewContainer, !isSplit && { marginBottom: insets.bottom }]}>
				{loopback.loading ? (
					loadingView
				) : (
					<WebView
						source={{ uri: loopback.url ?? call.url }}
						style={styles.webview}
						userAgent={userAgent}
						javaScriptEnabled
						domStorageEnabled
						allowsInlineMediaPlayback
						allowsPictureInPictureMediaPlayback
						mediaCapturePermissionGrantType='grant'
						mediaPlaybackRequiresUserAction={false}
						ignoreSslErrors
						onError={({ nativeEvent }) => loopback.onTlsError(nativeEvent.code)}
						startInLoadingState
						renderLoading={() => loadingView}
						renderError={(_domain, code, description) =>
							isTlsError(code) && loopback.loading ? (
								loadingView
							) : (
								<View style={[StyleSheet.absoluteFill, styles.webview, styles.error]}>
									<Text style={[sharedStyles.textRegular, { color: colors.fontWhite }]}>{description}</Text>
								</View>
							)
						}
					/>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		overflow: 'hidden',
		backgroundColor: '#000'
	},
	webviewContainer: { flex: 1 },
	webview: { flex: 1, backgroundColor: 'rgb(62,62,62)' },
	error: { alignItems: 'center', justifyContent: 'center', padding: 24 }
});

export default PexipCall;
