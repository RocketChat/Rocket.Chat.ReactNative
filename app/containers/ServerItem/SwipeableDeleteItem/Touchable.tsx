import { useRef, memo, type ReactElement } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GestureDetector, type PanGestureActiveEvent, usePanGesture } from 'react-native-gesture-handler';
import { View, type AccessibilityActionEvent } from 'react-native';
import { scheduleOnRN } from 'react-native-worklets';

import Touch from '~/containers/Touch';
import { DeleteAction } from './Actions';
import { useTheme } from '~/theme';
import I18n from '~/i18n';

export interface ISwipeableDeleteTouchableProps {
	children: ReactElement;
	testID: string;
	width: number;
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
	actionWidth,
	longSwipe,
	smallSwipe,
	backgroundColor,
	onPress,
	onDeletePress,
	accessibilityLabel,
	accessibilityHint
}: ISwipeableDeleteTouchableProps): ReactElement => {
	const { colors } = useTheme();

	const transX = useSharedValue(0);
	const rowOffSet = useSharedValue(0);
	const rowState = useSharedValue(0);
	const valueRef = useRef(0);

	const handlePress = () => {
		if (rowState.get() !== 0) {
			close();
			return;
		}

		if (onPress) {
			onPress();
		}
	};

	const close = () => {
		rowState.set(0);
		transX.set(withSpring(0, { overshootClamping: true }));
		rowOffSet.set(0);
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

	const handleRelease = (event: PanGestureActiveEvent) => {
		const { translationX } = event;
		valueRef.current += translationX;
		let toValue = 0;

		if (rowState.get() === 0) {
			// if no option is opened
			if (I18n.isRTL) {
				// RTL: swipe right (positive translationX) to show delete
				if (translationX > 0 && translationX < longSwipe) {
					// open delete action if swipe right
					toValue = actionWidth;
					rowState.set(1);
				} else if (translationX >= longSwipe) {
					// long swipe right - trigger delete immediately
					toValue = 0;
					rowState.set(1);
					handleDeletePress();
				} else {
					// any other gesture (including left swipes) - stay closed
					toValue = 0;
				}
			} else if (translationX < 0 && translationX > -longSwipe) {
				// LTR: open delete action if swipe left
				toValue = -actionWidth;
				rowState.set(1);
			} else if (translationX <= -longSwipe) {
				// LTR: long swipe left - trigger delete immediately
				toValue = 0;
				rowState.set(1);
				handleDeletePress();
			} else {
				// LTR: any other gesture (including right swipes) - stay closed
				toValue = 0;
			}
		} else if (rowState.get() === 1) {
			// if delete option is opened
			if (I18n.isRTL) {
				// RTL: delete is on the left (positive translation)
				if (valueRef.current < smallSwipe) {
					toValue = 0;
					rowState.set(0);
				} else if (valueRef.current > longSwipe) {
					handleDeletePress();
				} else {
					toValue = actionWidth;
				}
			} else if (valueRef.current > -smallSwipe) {
				// LTR: close if swipe back right
				toValue = 0;
				rowState.set(0);
			} else if (valueRef.current < -longSwipe) {
				// LTR: trigger delete on long swipe
				handleDeletePress();
			} else {
				// LTR: keep delete action open
				toValue = -actionWidth;
			}
		}

		// Use spring animation exactly like RoomItem
		transX.set(withSpring(toValue, { overshootClamping: true }));
		rowOffSet.set(toValue);
		valueRef.current = toValue;
	};

	const panGesture = usePanGesture({
		activeOffsetX: [-10, 10], // More sensitive horizontal detection
		failOffsetY: [-20, 20], // Fail on vertical movement to distinguish scrolling
		onUpdate: event => {
			const newValue = event.translationX + rowOffSet.get();

			if (I18n.isRTL) {
				// RTL: allow right swipes (positive values), prevent left swipes
				if (newValue < 0) {
					transX.set(0);
				} else {
					transX.set(newValue);
					// Limit how far right it can stretch
					if (transX.get() > width) transX.set(width);
				}
			} else if (newValue > 0) {
				// LTR: prevent right swipes
				transX.set(0);
			} else {
				// LTR: allow left swipes (negative values)
				transX.set(newValue);
				// Limit how far left it can stretch
				if (transX.get() < -width) transX.set(-width);
			}
		},
		onDeactivate: event => {
			scheduleOnRN(handleRelease, event);
		}
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
