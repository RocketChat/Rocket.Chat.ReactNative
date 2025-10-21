import React, { useRef, memo } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import {
	Gesture,
	GestureDetector,
	type GestureUpdateEvent,
	type PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import { View } from 'react-native';

import Touch from '../Touch';
import { DeleteAction } from './Actions';
import { useTheme } from '../../theme';
import I18n from '../../i18n';

export interface ISwipeableDeleteTouchableProps {
	children: JSX.Element;
	testID: string;
	width: number;
	rowHeight: number;
	actionWidth: number;
	longSwipe: number;
	smallSwipe: number;
	backgroundColor: string;
	onPress(): void;
	onDeletePress(): void;
}

const SwipeableDeleteTouchable = ({
	width,
	children,
	testID,
	rowHeight,
	actionWidth,
	longSwipe,
	smallSwipe,
	backgroundColor,
	onPress,
	onDeletePress
}: ISwipeableDeleteTouchableProps): React.ReactElement => {
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
			if (translationX < 0 && translationX > -longSwipe) {
				// open delete action if swipe left
				if (I18n.isRTL) {
					toValue = -actionWidth;
				} else {
					toValue = -1 * actionWidth;
				}
				rowState.value = 1;
			} else if (translationX <= -longSwipe) {
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
			if (valueRef.current > -1 * smallSwipe) {
				toValue = 0;
				rowState.value = 0;
			} else if (valueRef.current < -longSwipe) {
				handleDeletePress();
			} else if (I18n.isRTL) {
				toValue = -actionWidth;
			} else {
				toValue = -1 * actionWidth;
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
				// Limit how far left it can stretch
				if (transX.value < -1 * width) transX.value = -1 * width;
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
			<View>
				<DeleteAction
					width={width}
					transX={transX}
					rowHeight={rowHeight}
					actionWidth={actionWidth}
					longSwipe={longSwipe}
					onDeletePress={handleDeletePress}
					testID={`${testID}-delete`}
				/>
				<Animated.View style={animatedStyles}>
					<Touch
						onPress={handlePress}
						testID={testID}
						style={{
							backgroundColor: backgroundColor || colors.surfaceLight
						}}>
						{children}
					</Touch>
				</Animated.View>
			</View>
		</GestureDetector>
	);
};

export default memo(SwipeableDeleteTouchable);
