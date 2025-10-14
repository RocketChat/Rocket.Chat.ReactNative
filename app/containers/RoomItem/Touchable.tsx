import React, { useRef, memo } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector, type GestureUpdateEvent, type PanGestureHandlerEventPayload } from 'react-native-gesture-handler';

import Touch from '../Touch';
import { ACTION_WIDTH, LONG_SWIPE, SMALL_SWIPE } from './styles';
import { LeftActions, RightActions } from './Actions';
import { type ITouchableProps } from './interfaces';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { toggleFav } from '../../lib/methods/toggleFav';
import { toggleRead } from '../../lib/methods/toggleRead';
import { hideRoom } from '../../lib/methods/hideRoom';
import { useAppSelector } from '../../lib/hooks/useAppSelector';

const Touchable = ({
	children,
	type,
	onPress,
	onLongPress,
	testID,
	width,
	favorite,
	isRead,
	rid,
	isFocused,
	swipeEnabled,
	displayMode
}: ITouchableProps): React.ReactElement => {
	const { colors } = useTheme();
	const serverVersion = useAppSelector(state => state.server.version);
	const rowOffSet = useSharedValue(0);
	const transX = useSharedValue(0);
	const rowState = useSharedValue(0); // 0: closed, 1: right opened, -1: left opened
	const valueRef = useRef(0);

	const close = () => {
		rowState.value = 0;
		transX.value = withSpring(0, { overshootClamping: true });
		rowOffSet.value = 0;
		valueRef.current = 0;
	};

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
		if (rowState.value !== 0) {
			close();
			return;
		}
		if (onPress) {
			onPress();
		}
	};

	const handleLongPress = () => {
		if (rowState.value !== 0) {
			close();
			return;
		}

		if (onLongPress) {
			onLongPress();
		}
	};

	const handleRelease = (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
		const { translationX } = event;
		valueRef.current += translationX;
		let toValue = 0;
		if (rowState.value === 0) {
			// if no option is opened
			if (translationX > 0 && translationX < LONG_SWIPE) {
				if (I18n.isRTL) {
					toValue = 2 * ACTION_WIDTH;
				} else {
					toValue = ACTION_WIDTH;
				}
				rowState.value = -1;
			} else if (translationX >= LONG_SWIPE) {
				toValue = 0;
				if (I18n.isRTL) {
					handleHideChannel();
				} else {
					handleToggleRead();
				}
			} else if (translationX < 0 && translationX > -LONG_SWIPE) {
				// open trailing option if he swipe left
				if (I18n.isRTL) {
					toValue = -ACTION_WIDTH;
				} else {
					toValue = -2 * ACTION_WIDTH;
				}
				rowState.value = 1;
			} else if (translationX <= -LONG_SWIPE) {
				toValue = 0;
				rowState.value = 1;
				if (I18n.isRTL) {
					handleToggleRead();
				} else {
					handleHideChannel();
				}
			} else {
				toValue = 0;
			}
		} else if (rowState.value === -1) {
			// if left option is opened
			if (valueRef.current < SMALL_SWIPE) {
				toValue = 0;
				rowState.value = 0;
			} else if (valueRef.current > LONG_SWIPE) {
				toValue = 0;
				rowState.value = 0;
				if (I18n.isRTL) {
					handleHideChannel();
				} else {
					handleToggleRead();
				}
			} else if (I18n.isRTL) {
				toValue = 2 * ACTION_WIDTH;
			} else {
				toValue = ACTION_WIDTH;
			}
		} else if (rowState.value === 1) {
			// if right option is opened
			if (valueRef.current > -2 * SMALL_SWIPE) {
				toValue = 0;
				rowState.value = 0;
			} else if (valueRef.current < -LONG_SWIPE) {
				if (I18n.isRTL) {
					handleToggleRead();
				} else {
					handleHideChannel();
				}
			} else if (I18n.isRTL) {
				toValue = -ACTION_WIDTH;
			} else {
				toValue = -2 * ACTION_WIDTH;
			}
		}
		transX.value = withSpring(toValue, { overshootClamping: true });
		rowOffSet.value = toValue;
		valueRef.current = toValue;
	};

	const longPressGesture = Gesture.LongPress()
		.minDuration(500)
		.onStart(() => {
			runOnJS(handleLongPress)();
		});

	const panGesture = Gesture.Pan()
		.activeOffsetX([-10, 10]) // More sensitive horizontal detection
		.failOffsetY([-20, 20]) // Fail on vertical movement to distinguish scrolling
		.enabled(swipeEnabled)
		.onUpdate(event => {
			transX.value = event.translationX + rowOffSet.value;
			if (transX.value > 2 * width) transX.value = 2 * width;
		})
		.onEnd(event => {
			runOnJS(handleRelease)(event);
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
					isRead={isRead}
					width={width}
					onToggleReadPress={onToggleReadPress}
					displayMode={displayMode}
				/>
				<RightActions
					transX={transX}
					favorite={favorite}
					width={width}
					toggleFav={handleToggleFav}
					onHidePress={onHidePress}
					displayMode={displayMode}
				/>
				<Animated.View style={animatedStyles}>
					<Touch
						onPress={handlePress}
						testID={testID}
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
