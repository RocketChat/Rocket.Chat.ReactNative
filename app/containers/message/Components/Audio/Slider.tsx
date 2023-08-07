import React from 'react';
import { LayoutChangeEvent, View, TextInput } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
	useAnimatedGestureHandler,
	useAnimatedProps,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue
} from 'react-native-reanimated';

import styles from './styles';
import { useTheme } from '../../../../theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const Slider = ({ currentTime = 0, duration = 120, thumbColor = '' }) => {
	console.log('🚀 ~ file: Slider.tsx:18 ~ Slider ~ currentTime:', currentTime);
	const { colors } = useTheme();

	const maxWidth = useSharedValue(1);
	const x = useSharedValue(currentTime);
	const current = useSharedValue('00:00');
	const scale = useSharedValue(1);

	const styleLine = useAnimatedStyle(() => ({
		width: x.value,
		zIndex: 2
	}));

	const styleThumb = useAnimatedStyle(() => ({
		transform: [{ translateX: x.value }, { scale: scale.value }]
	}));

	const onLayout = (event: LayoutChangeEvent) => {
		const { width } = event.nativeEvent.layout;
		maxWidth.value = width - 12;
	};

	const gestureHandler = useAnimatedGestureHandler({
		onStart: (_, ctx: any) => {
			ctx.startX = x.value;
		},
		onActive: (event, ctx: any) => {
			const moveInX: number = ctx.startX + event.translationX;
			if (moveInX < 0) {
				x.value = 0;
			} else if (moveInX > maxWidth.value) {
				x.value = maxWidth.value;
			} else {
				x.value = moveInX;
			}

			scale.value = 1.3;
		},
		onEnd: () => {
			scale.value = 1;
			// SEND A CALLBACK TO CHANGE THE PROGRESS OF THE AUDIO
		}
	});

	useDerivedValue(() => {
		const cTime = (x.value * duration) / maxWidth.value;
		const minutes = Math.floor(cTime / 60);
		const remainingSeconds = Math.floor(cTime % 60);
		const formattedMinutes = String(minutes).padStart(2, '0');
		const formattedSeconds = String(remainingSeconds).padStart(2, '0');
		current.value = `${formattedMinutes}:${formattedSeconds}`;
	}, [x, maxWidth, duration]);

	const getCurrentTime = useAnimatedProps(
		() =>
			({
				text: current.value
			} as any),
		[current]
	);

	return (
		<View style={styles.sliderContainer}>
			<AnimatedTextInput
				defaultValue={'00:00'}
				editable={false}
				style={[styles.duration, { color: colors.bodyText }]}
				animatedProps={getCurrentTime}
			/>
			<View style={styles.slider} onLayout={onLayout}>
				<View style={[styles.line, { backgroundColor: colors.auxiliaryText }]} />
				<Animated.View style={[styles.line, styleLine, { backgroundColor: colors.tintColor }]} />
				<PanGestureHandler onGestureEvent={gestureHandler}>
					<Animated.View style={[styles.thumbSlider, { backgroundColor: thumbColor }, styleThumb]} />
				</PanGestureHandler>
			</View>
		</View>
	);
};

export default Slider;
