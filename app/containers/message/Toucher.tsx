import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import Touch from '../Touch';
import { RightActions } from './Actions';
import { ITouchableProps } from './interfaces';
import { WIDTH } from './styles';

const Touchable = ({
	children,
	onPress,
	onLongPress,
	disabled,
	onThreadPress,
	tmid,
	id,
	swipeEnabled,
	styles
}: ITouchableProps): React.ReactElement => {
	const rowOffSet = useSharedValue(0);
	const transX = useSharedValue(0);
	const rowState = useSharedValue(0);
	let _value = 0;

	const close = () => {
		rowState.value = 0;
		transX.value = withSpring(0, { overshootClamping: true });
		rowOffSet.value = 0;
	};

	const handlePress = () => {
		if (rowState.value !== 0) {
			close();
			return;
		}

		if (onPress) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onPress();
		}
	};
	const handleLongPress = () => {
		if (rowState.value !== 0) {
			close();
			return;
		}

		if (onLongPress) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onLongPress();
		}
	};

	const handleThreadPress = () => {
		if (onThreadPress) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onThreadPress(tmid, id);
		}
	};

	const handleRelease = (translationX: number) => {
		_value += translationX;
		let toValue = 0;

		if (rowState.value === 0) {
			if (translationX < 0 && translationX > -WIDTH) {
				toValue = -WIDTH;
				rowState.value = 1;
				Haptics.selectionAsync();
			} else if (translationX <= -WIDTH) {
				toValue = 0;
				rowState.value = 0;
				handleThreadPress();
			} else {
				toValue = 0;
				rowState.value = 0;
			}
		} else if (rowState.value === 1) {
			if (_value > -100) {
				toValue = 0;
				rowState.value = 0;
			} else if (_value < -WIDTH) {
				handleThreadPress();
				toValue = 0;
				rowState.value = 0;
			}
		}

		transX.value = withSpring(toValue, {
			damping: 20,
			stiffness: WIDTH,
			overshootClamping: true
		});

		rowOffSet.value = toValue;
		_value = toValue;
	};

	const panGesture = Gesture.Pan()
		.enabled(!disabled && swipeEnabled)
		.activeOffsetX([-20, 20])
		.onUpdate(event => {
			if (event.translationX <= 0 || rowState.value === 1) {
				transX.value = event.translationX + rowOffSet.value;

				if (transX.value < -2 * WIDTH) {
					transX.value = -2 * WIDTH;
				}

				if (rowState.value === 0 && transX.value > 0) {
					transX.value = 0;
				}
			}
		})
		.onEnd(event => {
			runOnJS(handleRelease)(event.translationX);
		});

	const longPressGesture = Gesture.LongPress()
		.enabled(!disabled)
		.onStart(() => {
			runOnJS(handleLongPress)();
		});

	const tapGesture = Gesture.Tap()
		.enabled(!disabled)
		.onEnd(() => {
			if (handlePress) {
				runOnJS(handlePress)();
			}
		});

	const composedGestures = Gesture.Exclusive(panGesture, Gesture.Race(longPressGesture, tapGesture));

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateX: transX.value }]
	}));

	return (
		<GestureHandlerRootView>
			<Animated.View>
				<GestureDetector gesture={composedGestures}>
					<Animated.View>
						<RightActions transX={transX} handleThreadPress={handleThreadPress} />
						<Animated.View style={animatedStyles}>
							<Touch style={styles} onPress={undefined}>
								{children}
							</Touch>
						</Animated.View>
					</Animated.View>
				</GestureDetector>
			</Animated.View>
		</GestureHandlerRootView>
	);
};

export default Touchable;
