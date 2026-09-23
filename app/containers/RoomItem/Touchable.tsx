import { useRef, useEffect, memo, type ReactElement } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import {
	Gesture,
	GestureDetector,
	type GestureUpdateEvent,
	type PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

import Touch from '../Touch';
import { getOpenWidth, getActionWidth, getFullSwipeThreshold, SWIPE_SPRING_CONFIG } from './styles';
import { LeftActions, RightActions } from './Actions';
import { getSwipeRelease, type TRowState } from './swipeRelease';
import { registerOpenSwipeItem, unregisterOpenSwipeItem, closeOpenSwipeItem } from './openSwipeItem';
import { type ITouchableProps } from './interfaces';
import { useTheme } from '~/theme';
import I18n from '~/i18n';
import { toggleFav } from '~/lib/methods/toggleFav';
import { toggleRead } from '~/lib/methods/toggleRead';
import { hideRoom } from '~/lib/methods/hideRoom';
import { useAppSelector } from '~/lib/hooks/useAppSelector';

const rubberband = (overshoot: number, dimension: number, constant = 0.55) => {
	'worklet';
	return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
};

const Touchable = ({
	children,
	type,
	onPress,
	onLongPress,
	width,
	favorite,
	isRead,
	rid,
	isFocused,
	swipeEnabled,
	displayMode
}: ITouchableProps): ReactElement => {
	const { colors } = useTheme();
	const serverVersion = useAppSelector(state => state.server.version);
	const rowOffSet = useSharedValue(0);
	const transX = useSharedValue(0);
	const rowState = useSharedValue(0); // 0: closed, 1: right opened, -1: left opened
	const gestureActive = useSharedValue(false);
	const valueRef = useRef(0);
	const consumedTouchRef = useRef(false);
	const touchStartHandledRef = useRef(false);

	const handleTouchBegin = (closedOtherRow: boolean) => {
		if (touchStartHandledRef.current) {
			return;
		}
		touchStartHandledRef.current = true;
		consumedTouchRef.current = closedOtherRow;
	};

	const close = () => {
		rowState.value = 0;
		transX.value = withSpring(0, SWIPE_SPRING_CONFIG);
		rowOffSet.value = 0;
		valueRef.current = 0;
		unregisterOpenSwipeItem(rid);
	};

	useEffect(() => () => unregisterOpenSwipeItem(rid), [rid]);

	const handleToggleFav = () => {
		toggleFav(rid, favorite);
		close();
	};

	const handleToggleRead = () => {
		toggleRead(rid, isRead, serverVersion);
	};

	const handleHideChannel = () => {
		hideRoom(rid, type);
	};

	const onToggleReadPress = () => {
		handleToggleRead();
		close();
	};

	const onHidePress = () => {
		handleHideChannel();
		close();
	};

	const handlePress = () => {
		touchStartHandledRef.current = false;
		if (rowState.value !== 0) {
			close();
			return;
		}
		if (consumedTouchRef.current) {
			consumedTouchRef.current = false;
			return;
		}
		if (onPress) {
			onPress();
		}
	};

	const handleLongPress = () => {
		touchStartHandledRef.current = false;
		if (rowState.value !== 0) {
			close();
			return;
		}
		if (consumedTouchRef.current) {
			consumedTouchRef.current = false;
			return;
		}

		if (onLongPress) {
			onLongPress();
		}
	};

	const handleLeftFullSwipe = () => (I18n.isRTL ? handleHideChannel() : handleToggleRead());

	const handleRightFullSwipe = () => (I18n.isRTL ? handleToggleRead() : handleHideChannel());

	const handleRelease = (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
		const release = getSwipeRelease({
			rowState: rowState.value as TRowState,
			offset: valueRef.current + event.translationX,
			actionWidth: getActionWidth(width),
			openWidth: getOpenWidth(width),
			fullSwipeThreshold: getFullSwipeThreshold(width)
		});
		if (release.fullSwipe === 'left') {
			handleLeftFullSwipe();
		} else if (release.fullSwipe === 'right') {
			handleRightFullSwipe();
		}
		rowState.value = release.rowState;
		transX.value = withSpring(release.toValue, { ...SWIPE_SPRING_CONFIG, velocity: event.velocityX });
		rowOffSet.value = release.toValue;
		valueRef.current = release.toValue;
		if (release.rowState !== 0) {
			registerOpenSwipeItem({ rid, transX, rowState, rowOffSet });
		} else {
			unregisterOpenSwipeItem(rid);
		}
	};

	const longPressGesture = Gesture.LongPress()
		.minDuration(500)
		.onStart(() => {
			scheduleOnRN(handleLongPress);
		});

	const panGesture = Gesture.Pan()
		.activeOffsetX([-10, 10]) // More sensitive horizontal detection
		.failOffsetY([-20, 20]) // Fail on vertical movement to distinguish scrolling
		.enabled(swipeEnabled)
		.onBegin(() => {
			gestureActive.value = true;
			const closedOtherRow = closeOpenSwipeItem(rid);
			scheduleOnRN(handleTouchBegin, closedOtherRow);
		})
		.onUpdate(event => {
			const next = event.translationX + rowOffSet.value;
			const boundary = getFullSwipeThreshold(width);
			transX.value =
				next > boundary
					? boundary + rubberband(next - boundary, width)
					: next < -boundary
						? -boundary - rubberband(-next - boundary, width)
						: next;
		})
		.onEnd(event => {
			gestureActive.value = false;
			scheduleOnRN(handleRelease, event);
		})
		.onFinalize(() => {
			gestureActive.value = false;
		});

	// Use Race instead of Simultaneous to prevent conflicts
	// Pan gesture will take priority over long press for horizontal swipes
	const composedGesture = Gesture.Race(panGesture, longPressGesture);

	const handleActiveStateChange = (active: boolean) => {
		if (!active) {
			touchStartHandledRef.current = false;
		}
	};

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateX: transX.value }]
	}));

	return (
		<GestureDetector gesture={composedGesture}>
			<Animated.View>
				<LeftActions
					transX={transX}
					gestureActive={gestureActive}
					isRead={isRead}
					width={width}
					onToggleReadPress={onToggleReadPress}
					displayMode={displayMode}
				/>
				<RightActions
					transX={transX}
					gestureActive={gestureActive}
					favorite={favorite}
					width={width}
					toggleFav={handleToggleFav}
					onHidePress={onHidePress}
					displayMode={displayMode}
				/>
				<Animated.View style={animatedStyles}>
					<Touch
						onPress={handlePress}
						onLongPress={handleLongPress}
						onActiveStateChange={handleActiveStateChange}
						style={{
							backgroundColor: isFocused ? colors.surfaceTint : colors.surfaceRoom
						}}>
						{children}
					</Touch>
				</Animated.View>
			</Animated.View>
		</GestureDetector>
	);
};

export default memo(Touchable);
