import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { type WebViewProps } from 'react-native-webview';
import { useShallow } from 'zustand/react/shallow';

import ActivityIndicator from '~/containers/ActivityIndicator';
import { CustomIcon } from '~/containers/CustomIcon';
import Touch from '~/containers/Touch';
import i18n from '~/i18n';
import { userAgent } from '~/lib/constants/userAgent';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useSubscription } from '~/lib/hooks/useSubscription';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import Navigation from '~/lib/navigation/appNavigation';
import { usePexipCallStore } from '~/lib/services/videoConf/usePexipCallStore';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { PexipCallTimer } from './PexipCallTimer';
import { isTlsError } from './pexipLoopbackProxy';
import { usePexipLoopbackUrl } from './usePexipLoopbackUrl';
import { usePexipPresenceLease } from './usePexipPresenceLease';
import { SPLIT_BAR_HEIGHT, usePexipSplitHeight } from './usePexipSplitHeight';

const MINI_WIDTH = 120;
const MINI_HEIGHT = 180;
const MINI_MARGIN = 12;

const PexipCall = () => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();
	const isMasterDetail = useMasterDetail();
	const splitHeight = usePexipSplitHeight();
	const { call, layout, split, minimize, expand, leave } = usePexipCallStore(
		useShallow(state => ({
			call: state.call,
			layout: state.layout,
			split: state.split,
			minimize: state.minimize,
			expand: state.expand,
			leave: state.leave
		}))
	);
	const room = useSubscription(call?.rid);
	const isPersistentChatEnabled = useAppSelector(state => !!state.settings.VideoConf_Enable_Persistent_Chat);
	usePexipPresenceLease(call?.callId, isPersistentChatEnabled);
	const loopback = usePexipLoopbackUrl(call);
	const minimized = layout === 'minimized';
	const isSplit = layout === 'split';

	const onError: WebViewProps['onError'] = ({ nativeEvent }) => {
		loopback.onTlsError(nativeEvent.code);
	};

	const minX = MINI_MARGIN;
	const maxX = width - MINI_WIDTH - MINI_MARGIN;
	const minY = insets.top + MINI_MARGIN;
	const maxY = height - MINI_HEIGHT - insets.bottom - MINI_MARGIN;

	const translateX = useSharedValue(maxX);
	const translateY = useSharedValue(maxY);
	const startX = useSharedValue(0);
	const startY = useSharedValue(0);

	useEffect(() => {
		if (!call) return;
		activateKeepAwake();
		return () => {
			deactivateKeepAwake();
		};
	}, [call]);

	const openChat = async () => {
		split();
		if (!call?.rid) return;
		const current = Navigation.getCurrentRoute();
		if (current?.name === 'RoomView' && (current.params as { rid?: string } | undefined)?.rid === call.rid) return;
		const subscription = await getSubscriptionByRoomId(call.rid);
		if (subscription) goRoom({ item: subscription, isMasterDetail });
	};

	const pan = Gesture.Pan()
		.enabled(minimized)
		.onStart(() => {
			startX.set(translateX.get());
			startY.set(translateY.get());
		})
		.onUpdate(e => {
			translateX.set(Math.min(Math.max(startX.get() + e.translationX, minX), maxX));
			translateY.set(Math.min(Math.max(startY.get() + e.translationY, minY), maxY));
		})
		.onEnd(() => {
			translateX.set(withSpring(translateX.get() + MINI_WIDTH / 2 < width / 2 ? minX : maxX));
		});
	const tap = Gesture.Tap()
		.enabled(minimized)
		.onEnd(() => {
			scheduleOnRN(expand);
		});

	const containerStyle = useAnimatedStyle(() => {
		if (isSplit) {
			return {
				top: insets.top,
				left: 0,
				width,
				height: splitHeight,
				borderRadius: 0,
				transform: [{ translateX: 0 }, { translateY: 0 }]
			};
		}
		return minimized
			? {
					top: 0,
					left: 0,
					width: MINI_WIDTH,
					height: MINI_HEIGHT,
					borderRadius: 12,
					transform: [{ translateX: translateX.get() }, { translateY: translateY.get() }]
				}
			: { top: 0, left: 0, width, height, borderRadius: 0, transform: [{ translateX: 0 }, { translateY: 0 }] };
	});

	if (!call) return null;

	const loadingView = (
		<View style={[StyleSheet.absoluteFill, styles.webview]}>
			<ActivityIndicator absolute size='large' color={colors.fontWhite} />
		</View>
	);

	return (
		<GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
			<Animated.View
				style={[styles.container, containerStyle]}
				testID={minimized ? 'pexip-call-minimized' : isSplit ? 'pexip-call-split' : 'pexip-call'}>
				{!minimized ? (
					<View
						style={[
							styles.topBar,
							isSplit ? { height: SPLIT_BAR_HEIGHT } : { paddingTop: insets.top, height: SPLIT_BAR_HEIGHT + insets.top }
						]}>
						<Touch
							onPress={leave}
							style={[styles.button, { backgroundColor: colors.buttonBackgroundDangerDefault }]}
							accessibilityLabel={i18n.t('End')}
							testID='pexip-call-leave'>
							<CustomIcon name='phone-off' size={20} color={colors.fontWhite} />
						</Touch>
						<PexipCallTimer startedAt={call.startedAt} style={[styles.timer, { color: colors.fontWhite }]} />
						<View style={styles.divider} />
						<Text style={[styles.title, { color: colors.fontWhite }]} numberOfLines={1}>
							{room?.fname || room?.name || i18n.t('Video_call')}
						</Text>
						{isSplit ? (
							<Touch
								onPress={expand}
								style={[styles.button, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}
								accessibilityLabel={i18n.t('Expand')}
								testID='pexip-call-expand-full'>
								<CustomIcon name='arrow-expand' size={20} color={colors.fontDefault} />
							</Touch>
						) : null}
						{!isSplit && call.rid ? (
							<Touch
								onPress={openChat}
								style={[styles.button, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}
								accessibilityLabel={i18n.t('Chat')}
								testID='pexip-call-chat'>
								<CustomIcon name='message' size={20} color={colors.fontDefault} />
							</Touch>
						) : null}
						<Touch
							onPress={minimize}
							style={[styles.button, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}
							accessibilityLabel={i18n.t('Minimize')}
							testID='pexip-call-minimize'>
							<CustomIcon name='arrow-collapse' size={20} color={colors.fontDefault} />
						</Touch>
					</View>
				) : null}
				<View style={[styles.webviewContainer, layout === 'full' && { marginBottom: insets.bottom }]}>
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
							onError={onError}
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
					{minimized ? (
						<View
							style={StyleSheet.absoluteFill}
							accessible
							accessibilityRole='button'
							accessibilityLabel={i18n.t('Video_call')}
							testID='pexip-call-expand'
						/>
					) : null}
				</View>
			</Animated.View>
		</GestureDetector>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		overflow: 'hidden',
		zIndex: 1000,
		backgroundColor: '#000',
		elevation: 10
	},
	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		gap: 8
	},
	timer: {
		...sharedStyles.textBold,
		fontSize: 16
	},
	divider: {
		backgroundColor: '#6C727A',
		width: StyleSheet.hairlineWidth,
		height: 20
	},
	title: {
		...sharedStyles.textRegular,
		fontSize: 16,
		flex: 1
	},
	button: {
		width: 36,
		height: 36,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center'
	},
	webviewContainer: { flex: 1 },
	webview: { flex: 1, backgroundColor: 'rgb(62,62,62)' },
	error: { alignItems: 'center', justifyContent: 'center', padding: 24 }
});

export default PexipCall;
