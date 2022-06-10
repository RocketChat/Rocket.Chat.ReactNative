import React, { useEffect, useState } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Touchable from 'react-native-platform-touchable';
import Animated, { useSharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';

import styles, { SLIDER_THUMB_RADIUS } from './styles';
import { useTheme } from '../../theme';

interface ISliderProps {
	value: number;
	maximumValue: number;
	onValueChange: (value: number) => Promise<void>;
	thumbTintColor?: string;
	minimumTrackTintColor?: string;
	maximumTrackTintColor?: string;
	disabled?: boolean;
	thumbImage?: { uri: string; scale: number | undefined };
	containerStyle?: StyleProp<ViewStyle>;
}

const Slider = React.memo(
	({
		value,
		maximumValue,
		onValueChange,
		thumbTintColor,
		minimumTrackTintColor,
		maximumTrackTintColor,
		disabled,
		containerStyle
	}: ISliderProps) => {
		const { colors } = useTheme();
		const [sliderWidth, setSliderWidth] = useState<number>(0);
		const position = useSharedValue(0);
		const currentValue = useSharedValue(0);

		useEffect(() => {
			if (value !== currentValue.value) {
				currentValue.value = value;
			}
		}, [value]);

		const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

		const equivalentValue = (sliderPosition: number) => interpolate(sliderPosition, [0, sliderWidth], [0, maximumValue]);

		const onLayout = (event: any) => {
			setSliderWidth(event.nativeEvent.layout.width);
		};

		const tapGesture = Gesture.Tap().onStart(e => {
			position.value = clamp(e.x, 0, sliderWidth);
			currentValue.value = equivalentValue(position.value);
			onValueChange(currentValue.value);
		});

		const dragGesture = Gesture.Pan()
			.onChange(e => {
				position.value = clamp(e.x, 0, sliderWidth);
				currentValue.value = equivalentValue(position.value);
				onValueChange(currentValue.value);
			})
			.onEnd(() => {
				onValueChange(currentValue.value);
			});

		const animatedThumbStyles = useAnimatedStyle(() => ({
			transform: [
				{
					translateX: interpolate(currentValue.value, [0, maximumValue], [0, sliderWidth]) - SLIDER_THUMB_RADIUS
				}
			]
		}));

		const animatedTrackStyles = useAnimatedStyle(() => ({
			width: interpolate(currentValue.value, [0, maximumValue], [0, sliderWidth])
		}));

		const gesture = disabled ? undefined : Gesture.Simultaneous(tapGesture, dragGesture);

		return (
			<View style={[styles.sliderContainer, containerStyle]}>
				<Touchable onPress={() => {}}>
					<GestureDetector gesture={gesture}>
						<View
							style={[styles.track, { backgroundColor: maximumTrackTintColor || colors.buttonBackground }]}
							onLayout={onLayout}>
							<Animated.View
								style={[styles.sliderThumb, { backgroundColor: thumbTintColor || colors.tintColor }, animatedThumbStyles]}
							/>
							<Animated.View
								style={[styles.activeTrack, { backgroundColor: minimumTrackTintColor || colors.tintColor }, animatedTrackStyles]}
							/>
						</View>
					</GestureDetector>
				</Touchable>
			</View>
		);
	}
);

export default Slider;
