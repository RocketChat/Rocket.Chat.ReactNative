import React, { useEffect, useState } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, withTiming, Easing } from 'react-native-reanimated';

import styles, { SLIDER_THUMB_RADIUS } from '../../styles';
import { useTheme } from '../../../../theme';

interface ISliderProps {
	value: number;
	maximumValue: number;
	onValueChange: (value: number) => void;
	onSlidingEnd: (value: number) => void;
	thumbTintColor?: string;
	activeTrackColor: string;
	trackColor: string;
	disabled?: boolean;
	thumbImage?: { uri: string; scale: number | undefined };
	containerStyle?: StyleProp<ViewStyle>;
	animationConfig?: { duration: number; easing: Animated.EasingFunction };
}

const Slider = ({
	value,
	maximumValue,
	onValueChange,
	onSlidingEnd,
	thumbTintColor,
	activeTrackColor,
	trackColor,
	disabled,
	containerStyle,
	animationConfig = {
		duration: 200,
		easing: Easing.linear
	}
}: ISliderProps): React.ReactElement => {
	const { colors } = useTheme();
	const [sliderWidth, setSliderWidth] = useState<number>(0);
	const [isSliding, setSliding] = useState<boolean>(false);
	const sliderThumbWidth = useSharedValue(2 * SLIDER_THUMB_RADIUS);
	const currentValue = useSharedValue(0);

	useEffect(() => {
		if (!isSliding) {
			currentValue.value = withTiming(value, animationConfig);
		}
	}, [value, isSliding]);

	const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

	const equivalentValue = (sliderPosition: number) => interpolate(sliderPosition, [0, sliderWidth], [0, maximumValue]);

	const onLayout = (event: any) => {
		setSliderWidth(event.nativeEvent.layout.width);
	};

	const tapGesture = Gesture.Tap()
		.hitSlop({ vertical: 10 })
		.onStart(e => {
			currentValue.value = equivalentValue(clamp(e.x, 0, sliderWidth));
			onValueChange(equivalentValue(clamp(e.x, 0, sliderWidth)));
			onSlidingEnd(equivalentValue(clamp(e.x, 0, sliderWidth)));
		});

	const dragGesture = Gesture.Pan()
		.hitSlop({ horizontal: 5, vertical: 20 })
		.onStart(() => {
			setSliding(true);
			sliderThumbWidth.value = withTiming(3 * SLIDER_THUMB_RADIUS, { duration: 100 });
		})
		.onChange(e => {
			currentValue.value = equivalentValue(clamp(e.x, 0, sliderWidth));
			onValueChange(equivalentValue(clamp(e.x, 0, sliderWidth)));
		})
		.onEnd(e => {
			sliderThumbWidth.value = withTiming(2 * SLIDER_THUMB_RADIUS, { duration: 100 });
			currentValue.value = equivalentValue(clamp(e.x, 0, sliderWidth));
			onValueChange(equivalentValue(clamp(e.x, 0, sliderWidth)));
			onSlidingEnd(equivalentValue(clamp(e.x, 0, sliderWidth)));
			setSliding(false);
		});

	const animatedThumbStyles = useAnimatedStyle(() => ({
		transform: [
			{
				translateX: interpolate(currentValue.value, [0, maximumValue], [0, sliderWidth]) - SLIDER_THUMB_RADIUS
			}
		],
		width: sliderThumbWidth.value,
		height: sliderThumbWidth.value
	}));

	const animatedTrackStyles = useAnimatedStyle(() => ({
		width: interpolate(currentValue.value, [0, maximumValue], [0, sliderWidth])
	}));

	const gesture = disabled ? undefined : Gesture.Simultaneous(tapGesture, dragGesture);

	return (
		<View style={[styles.sliderContainer, containerStyle]}>
			<GestureDetector gesture={gesture}>
				<View style={[styles.track, { backgroundColor: trackColor }]} onLayout={onLayout}>
					<Animated.View
						style={[styles.sliderThumb, { backgroundColor: thumbTintColor || colors.tintColor }, animatedThumbStyles]}
					/>
					<Animated.View style={[styles.activeTrack, { backgroundColor: activeTrackColor }, animatedTrackStyles]} />
				</View>
			</GestureDetector>
		</View>
	);
};

export default Slider;
