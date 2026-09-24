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
import { registerOpenSwipeItem, unregisterOpenSwipeItem, closeOpenSwipeItem, resetSwipeRow } from './openSwipeItem';
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
	const rowState = useSharedValue<TRowState>(0);
	const gestureActive = useSharedValue(false);
	const consumedTouchRef = useRef(false);

	const handleTouchBegin = (closedOtherRow: boolean) => {
		consumedTouchRef.current = closedOtherRow;
	};

	const close = () => {
		resetSwipeRow({ transX, rowState, rowOffSet });
		unregisterOpenSwipeItem(rid);
	};

	useEffect(() => () => unregisterOpenSwipeItem(rid), [rid]);

	const handleToggleFav = () => {
		toggleFav(rid, favorite);
		close();
	};

	const toggleReadRoom = () => toggleRead(rid, isRead, serverVersion);

	const hideChannel = () => hideRoom(rid, type);

	const onToggleReadPress = () => {
		toggleReadRoom();
		close();
	};

	const onHidePress = () => {
		hideChannel();
		close();
	};

	const guardTouch = (action?: () => void) => () => {
		if (rowState.value !== 0) {
			close();
			return;
		}
		if (consumedTouchRef.current) {
			consumedTouchRef.current = false;
			return;
		}
		action?.();
	};

	const handlePress = guardTouch(onPress);

	const handleLongPress = guardTouch(onLongPress);

	const handleRelease = (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
		const release = getSwipeRelease({
			rowState: rowState.value,
			offset: rowOffSet.value + event.translationX,
			actionWidth: getActionWidth(width),
			openWidth: getOpenWidth(width),
			fullSwipeThreshold: getFullSwipeThreshold(width)
		});
		if (release.fullSwipe === (I18n.isRTL ? 'left' : 'right')) {
			hideChannel();
		} else if (release.fullSwipe) {
			toggleReadRoom();
		}
		rowState.value = release.rowState;
		transX.value = withSpring(release.toValue, { ...SWIPE_SPRING_CONFIG, velocity: event.velocityX });
		rowOffSet.value = release.toValue;
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
			gestureActive.set(true);
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
			gestureActive.set(false);
			scheduleOnRN(handleRelease, event);
		})
		.onFinalize(() => {
			gestureActive.set(false);
		});

	// Use Race instead of Simultaneous to prevent conflicts
	// Pan gesture will take priority over long press for horizontal swipes
	const composedGesture = Gesture.Race(panGesture, longPressGesture);

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
