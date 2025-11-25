import React, { useRef, memo } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import {
	Gesture,
	GestureDetector,
	type GestureUpdateEvent,
	type PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import { View, type AccessibilityActionEvent } from 'react-native';

import Touch from '../../Touch';
import { DeleteAction } from './Actions';
import { useTheme } from '../../../theme';
import I18n from '../../../i18n';

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
	accessibilityLabel?: string;
	accessibilityHint?: string;
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
	onDeletePress,
	accessibilityLabel,
	accessibilityHint
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

	const onAccessibilityAction = (event: AccessibilityActionEvent) => {
		switch (event.nativeEvent.actionName) {
			case 'delete':
				handleDeletePress();
				break;
		}
	};

	const handleRelease = (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
		const { translationX } = event;
		valueRef.current += translationX;
		let toValue = 0;

		if (rowState.value === 0) {
			// if no option is opened
			if (I18n.isRTL) {
				// RTL: swipe right (positive translationX) to show delete
				if (translationX > 0 && translationX < longSwipe) {
					// open delete action if swipe right
					toValue = actionWidth;
					rowState.value = 1;
				} else if (translationX >= longSwipe) {
					// long swipe right - trigger delete immediately
					toValue = 0;
					rowState.value = 1;
					handleDeletePress();
				} else {
					// any other gesture (including left swipes) - stay closed
					toValue = 0;
				}
			} else if (translationX < 0 && translationX > -longSwipe) {
				// LTR: open delete action if swipe left
				toValue = -actionWidth;
				rowState.value = 1;
			} else if (translationX <= -longSwipe) {
				// LTR: long swipe left - trigger delete immediately
				toValue = 0;
				rowState.value = 1;
				handleDeletePress();
			} else {
				// LTR: any other gesture (including right swipes) - stay closed
				toValue = 0;
			}
		} else if (rowState.value === 1) {
			// if delete option is opened
			if (I18n.isRTL) {
				// RTL: delete is on the left (positive translation)
				if (valueRef.current < smallSwipe) {
					toValue = 0;
					rowState.value = 0;
				} else if (valueRef.current > longSwipe) {
					handleDeletePress();
				} else {
					toValue = actionWidth;
				}
			} else if (valueRef.current > -smallSwipe) {
				// LTR: close if swipe back right
				toValue = 0;
				rowState.value = 0;
			} else if (valueRef.current < -longSwipe) {
				// LTR: trigger delete on long swipe
				handleDeletePress();
			} else {
				// LTR: keep delete action open
				toValue = -actionWidth;
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

			if (I18n.isRTL) {
				// RTL: allow right swipes (positive values), prevent left swipes
				if (newValue < 0) {
					transX.value = 0;
				} else {
					transX.value = newValue;
					// Limit how far right it can stretch
					if (transX.value > width) transX.value = width;
				}
			} else if (newValue > 0) {
				// LTR: prevent right swipes
				transX.value = 0;
			} else {
				// LTR: allow left swipes (negative values)
				transX.value = newValue;
				// Limit how far left it can stretch
				if (transX.value < -width) transX.value = -width;
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
						}}
						accessible
						accessibilityLabel={accessibilityLabel}
						accessibilityHint={accessibilityHint}
						accessibilityActions={[{ name: 'delete', label: I18n.t('Delete') }]}
						onAccessibilityAction={onAccessibilityAction}>
						{children}
					</Touch>
				</Animated.View>
			</View>
		</GestureDetector>
	);
};

export default memo(SwipeableDeleteTouchable);

