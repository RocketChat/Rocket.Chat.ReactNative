import React from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import Touch from '../../Touch';
import { RightActions } from '../Actions';
import { ITouchableProps } from '../interfaces';
import { WIDTH } from '../styles';

const CLOSED = 0;
const OPEN = -WIDTH;
const DRAG_THRESHOLD = -100;

const Touchable = ({
	children,
	onPress,
	onLongPress,
	disabled,
	onThreadPress,
	tmid,
	id,
	swipeEnabled,
	style
}: ITouchableProps): React.ReactElement => {
	const transX = useSharedValue(0);
	let initial = 0;

	const close = () => {
		transX.value = withSpring(CLOSED, { overshootClamping: true });
	};

	const handleLongPress = () => {
		if (transX.value !== CLOSED) {
			close();
			return;
		}
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		if (onLongPress) {
			onLongPress();
		}
	};

	const handleThreadPress = () => {
		Haptics.selectionAsync();
		if (onThreadPress) {
			onThreadPress(tmid, id);
		}
	};

	const panGesture = Gesture.Pan()
		.enabled(swipeEnabled && !disabled)
		.activeOffsetX([-20, 20])
		.failOffsetY([-10, 10])
		.onStart(() => {
			initial = transX.value;
		})
		.onUpdate(event => {
			let next = initial + event.translationX;
			if (next > 0) next = 0;
			if (next < -2 * WIDTH) next = -2 * WIDTH;
			transX.value = next;
		})
		.onEnd(event => {
			const final = initial + event.translationX;
			if (final <= OPEN) {
				runOnJS(handleThreadPress)();
				transX.value = withSpring(CLOSED, {
					damping: 20,
					stiffness: WIDTH,
					overshootClamping: true
				});
			} else if (final < DRAG_THRESHOLD) {
				transX.value = withSpring(OPEN, {
					damping: 20,
					stiffness: WIDTH,
					overshootClamping: true
				});
			} else {
				transX.value = withSpring(CLOSED, {
					damping: 20,
					stiffness: WIDTH,
					overshootClamping: true
				});
			}
		});

	const longPressGesture = Gesture.LongPress()
		.minDuration(600)
		.onStart(() => {
			if (!disabled) {
				runOnJS(handleLongPress)();
			}
		});

	const tapGesture = Gesture.Tap().onEnd(() => {
		if (!disabled && onPress) {
			runOnJS(onPress)();
		}
	});

	const composedGesture = Gesture.Race(tapGesture, longPressGesture, panGesture);

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateX: transX.value }]
	}));

	return (
		<GestureDetector gesture={composedGesture}>
			<Animated.View>
				<RightActions transX={transX} handleThreadPress={handleThreadPress} />
				<Animated.View style={animatedStyles}>
					<Touch style={style}>{children}</Touch>
				</Animated.View>
			</Animated.View>
		</GestureDetector>
	);
};

export default Touchable;
