import React from 'react';
import { LayoutChangeEvent, View, TextInput } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
	SharedValue,
	runOnJS,
	useAnimatedGestureHandler,
	useAnimatedProps,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue
} from 'react-native-reanimated';

import styles from './styles';
import { useTheme } from '../../../../theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface ISlider {
	duration: SharedValue<number>;
	currentTime: SharedValue<number>;
	loaded: boolean;
	onChangeTime: (time: number) => Promise<void>;
}

const Slider = ({ currentTime, duration, loaded = false, onChangeTime }: ISlider) => {
	const { colors } = useTheme();

	const maxWidth = useSharedValue(1);
	const x = useSharedValue(0);
	const current = useSharedValue('00:00');
	const scale = useSharedValue(1);
	const isHandlePan = useSharedValue(false);
	const onEndGestureHandler = useSharedValue(false);

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
			isHandlePan.value = true;
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
			isHandlePan.value = false;
			onEndGestureHandler.value = true;
		}
	});

	const wrapper = async (time: number) => {
		await onChangeTime(Math.round(time * 1000));
		onEndGestureHandler.value = false;
	};

	useDerivedValue(() => {
		if (onEndGestureHandler.value) {
			runOnJS(wrapper)(currentTime.value);
		}
	});

	useDerivedValue(() => {
		let minutes;
		let remainingSeconds;
		if (isHandlePan.value) {
			const cTime = (x.value * duration.value) / maxWidth.value || 0;
			currentTime.value = cTime;
			minutes = Math.floor(cTime / 60);
			remainingSeconds = Math.floor(cTime % 60);
		} else {
			const xTime = (currentTime.value * maxWidth.value) / duration.value || 0;
			x.value = xTime;
			minutes = Math.floor(currentTime.value / 60);
			remainingSeconds = Math.floor(currentTime.value % 60);
		}
		const formattedMinutes = String(minutes).padStart(2, '0');
		const formattedSeconds = String(remainingSeconds).padStart(2, '0');
		current.value = `${formattedMinutes}:${formattedSeconds}`;
	}, [x, maxWidth, duration, isHandlePan, currentTime]);

	const getCurrentTime = useAnimatedProps(
		() =>
			({
				text: current.value
			} as any),
		[current]
	);

	const thumbColor = loaded ? colors.audioPlayerPrimary : colors.tintDisabled;

	return (
		<View style={styles.sliderContainer}>
			<AnimatedTextInput
				defaultValue={'00:00'}
				editable={false}
				style={[styles.duration, { color: colors.audioTimeText }]}
				animatedProps={getCurrentTime}
			/>
			<View style={styles.slider} onLayout={onLayout}>
				<View style={[styles.line, { backgroundColor: colors.audioPlayerSecondary }]} />
				<Animated.View style={[styles.line, styleLine, { backgroundColor: colors.audioPlayerPrimary }]} />
				<PanGestureHandler enabled={loaded} onGestureEvent={gestureHandler}>
					<Animated.View style={[styles.thumbSlider, { backgroundColor: thumbColor }, styleThumb]} />
				</PanGestureHandler>
			</View>
		</View>
	);
};

export default Slider;
