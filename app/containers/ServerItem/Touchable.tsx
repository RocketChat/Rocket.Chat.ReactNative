import React, { useRef, memo } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';

import Touch from '../Touch';
import { ACTION_WIDTH, LONG_SWIPE, SMALL_SWIPE } from './styles';
import { DeleteAction } from './Actions';
import { useTheme } from '../../theme';
import I18n from '../../i18n';

export interface IServerItemTouchableProps {
	children: JSX.Element;
	testID: string;
	width: number;
	onPress(): void;
	onDeletePress(): void;
}

const Touchable = ({ children, testID, width, onPress, onDeletePress }: IServerItemTouchableProps): React.ReactElement => {
	const { colors } = useTheme();

	const transX = useSharedValue(0);
	const rowOffSet = useSharedValue(0);
	const rowState = useSharedValue(0);
	const valueRef = useRef(0);

	const handlePress = () => {
		if (rowState.value !== 0) {
			close();
			return;
		}

		if (onPress) {
			onPress();
		}
	};

	const close = () => {
		rowState.value = 0;
		transX.value = withSpring(0, { overshootClamping: true });
		rowOffSet.value = 0;
		valueRef.current = 0;
	};

	const handleDeletePress = () => {
		close();
		if (onDeletePress) {
			onDeletePress();
		}
	};

	const handleRelease = (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
		const { translationX } = event;
		valueRef.current += translationX;
		let toValue = 0;

		if (rowState.value === 0) {
			// if no option is opened - only allow left swipes (negative translationX)
			if (translationX < 0 && translationX > -LONG_SWIPE) {
				// open delete action if swipe left
				if (I18n.isRTL) {
					toValue = -ACTION_WIDTH;
				} else {
					toValue = -2 * ACTION_WIDTH;
				}
				rowState.value = 1;
			} else if (translationX <= -LONG_SWIPE) {
				// long swipe left - trigger delete immediately
				toValue = 0;
				rowState.value = 1;
				handleDeletePress();
			} else {
				// any other gesture (including right swipes) - stay closed
				toValue = 0;
			}
		} else if (rowState.value === 1) {
			// if right option is opened (delete action)
			if (valueRef.current > -2 * SMALL_SWIPE) {
				toValue = 0;
				rowState.value = 0;
			} else if (valueRef.current < -LONG_SWIPE) {
				handleDeletePress();
			} else if (I18n.isRTL) {
				toValue = -ACTION_WIDTH;
			} else {
				toValue = -2 * ACTION_WIDTH;
			}
		}

		// Use spring animation exactly like RoomItem
		transX.value = withSpring(toValue, { overshootClamping: true });
		rowOffSet.value = toValue;
		valueRef.current = toValue;
	};

	const panGesture = Gesture.Pan()
		.activeOffsetX([-10, 10]) // More sensitive horizontal detection
		.failOffsetY([-20, 20]) // Fail on vertical movement to distinguish scrolling
		.onUpdate(event => {
			const newValue = event.translationX + rowOffSet.value;
			// Prevent right swipe - only allow left swipes (negative values)
			if (newValue > 0) {
				transX.value = 0;
			} else {
				transX.value = newValue;
			}
		})
		.onEnd(event => {
			runOnJS(handleRelease)(event);
		});

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateX: transX.value }]
	}));

	return (
		<GestureDetector gesture={panGesture}>
			<Animated.View>
				<DeleteAction transX={transX} width={width} onDeletePress={handleDeletePress} testID={`${testID}-delete`} />
				<Animated.View style={animatedStyles}>
					<Touch
						onPress={handlePress}
						testID={testID}
						style={{
							backgroundColor: colors.surfaceRoom
						}}>
						{children}
					</Touch>
				</Animated.View>
			</Animated.View>
		</GestureDetector>
	);
};

export default memo(Touchable);
