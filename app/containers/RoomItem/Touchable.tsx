import React from 'react';
import Animated, {
	useAnimatedGestureHandler,
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	runOnJS
} from 'react-native-reanimated';
import {
	LongPressGestureHandler,
	PanGestureHandler,
	State,
	HandlerStateChangeEventPayload,
	PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';

import Touch from '../Touch';
import { ACTION_WIDTH, LONG_SWIPE, SMALL_SWIPE } from './styles';
import { LeftActions, RightActions } from './Actions';
import { ITouchableProps } from './interfaces';
import { useTheme } from '../../theme';
import I18n from '../../i18n';

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
	toggleFav,
	toggleRead,
	hideChannel,
	isFocused,
	swipeEnabled,
	displayMode
}: ITouchableProps): React.ReactElement => {
	const { colors } = useTheme();

	const rowOffSet = useSharedValue(0);
	const transX = useSharedValue(0);
	const rowState = useSharedValue(0); // 0: closed, 1: right opened, -1: left opened
	let _value = 0;

	const close = () => {
		rowState.value = 0;
		transX.value = withSpring(0, { overshootClamping: true });
		rowOffSet.value = 0;
	};

	const handleToggleFav = () => {
		if (toggleFav) {
			toggleFav(rid, favorite);
		}
		close();
	};

	const handleToggleRead = () => {
		if (toggleRead) {
			toggleRead(rid, isRead);
		}
	};

	const handleHideChannel = () => {
		if (hideChannel) {
			hideChannel(rid, type);
		}
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

	const onLongPressHandlerStateChange = ({ nativeEvent }: { nativeEvent: HandlerStateChangeEventPayload }) => {
		if (nativeEvent.state === State.ACTIVE) {
			handleLongPress();
		}
	};

	const handleRelease = (event: PanGestureHandlerEventPayload) => {
		const { translationX } = event;
		_value += translationX;
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
			if (_value < SMALL_SWIPE) {
				toValue = 0;
				rowState.value = 0;
			} else if (_value > LONG_SWIPE) {
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
			if (_value > -2 * SMALL_SWIPE) {
				toValue = 0;
				rowState.value = 0;
			} else if (_value < -LONG_SWIPE) {
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
		_value = toValue;
	};

	const onGestureEvent = useAnimatedGestureHandler({
		onActive: event => {
			transX.value = event.translationX + rowOffSet.value;
			if (transX.value > 2 * width) transX.value = 2 * width;
		},
		onEnd: event => {
			runOnJS(handleRelease)(event);
		}
	});

	const animatedStyles = useAnimatedStyle(() => ({ transform: [{ translateX: transX.value }] }));

	return (
		<LongPressGestureHandler onHandlerStateChange={onLongPressHandlerStateChange}>
			<Animated.View>
				<PanGestureHandler activeOffsetX={[-20, 20]} onGestureEvent={onGestureEvent} enabled={swipeEnabled}>
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
								}}
							>
								{children}
							</Touch>
						</Animated.View>
					</Animated.View>
				</PanGestureHandler>
			</Animated.View>
		</LongPressGestureHandler>
	);
};

export default Touchable;
