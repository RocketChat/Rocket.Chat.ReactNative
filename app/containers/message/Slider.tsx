import React, { useState } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Touchable from 'react-native-platform-touchable';
import Animated, { useSharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';

import styles, { SLIDER_THUMB_RADIUS } from './styles';
import { useTheme } from '../../theme';
import { debounce } from '../../lib/methods/helpers';

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
		const position = useSharedValue(value);
		// console.log('Slider', value, maximumValue);

		const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

		const equivalentValue = (sliderPosition: number) => interpolate(sliderPosition, [0, sliderWidth], [0, maximumValue]);

		const onLayout = (event: any) => {
			setSliderWidth(event.nativeEvent.layout.width);
		};

		const onChangeDebounce = debounce((currentValue: number) => onValueChange(currentValue), 50);

		const tapGesture = Gesture.Tap().onStart(e => {
			position.value = clamp(e.x, 0, sliderWidth);
			onValueChange(equivalentValue(position.value));
		});

		const dragGesture = Gesture.Pan()
			.onChange(e => {
				position.value = clamp(e.x, 0, sliderWidth);
				onChangeDebounce(equivalentValue(position.value));
			})
			.onEnd(() => {
				onValueChange(equivalentValue(position.value));
			});

		const animatedThumbStyles = useAnimatedStyle(() => ({
			transform: [
				{
					translateX: interpolate(value, [0, maximumValue], [0, sliderWidth]) - SLIDER_THUMB_RADIUS
				}
			]
		}));

		const animatedTrackStyles = useAnimatedStyle(() => ({
			width: interpolate(value, [0, maximumValue], [0, sliderWidth])
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
