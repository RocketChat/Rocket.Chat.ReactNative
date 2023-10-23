import React from 'react';
import { LayoutChangeEvent, View, TextInput, TextInputProps } from 'react-native';
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
import { useTheme } from '../../theme';
import { AUDIO_BUTTON_HIT_SLOP } from './utils';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface ISeek {
	duration: SharedValue<number>;
	currentTime: SharedValue<number>;
	loaded: boolean;
	onChangeTime: (time: number) => Promise<void>;
}

const Seek = ({ currentTime, duration, loaded = false, onChangeTime }: ISeek) => {
	const { colors } = useTheme();

	const maxWidth = useSharedValue(1);
	const x = useSharedValue(0);
	const current = useSharedValue('00:00');
	const scale = useSharedValue(1);
	const isHandlePan = useSharedValue(false);
	const onEndGestureHandler = useSharedValue(false);
	const isTimeChanged = useSharedValue(false);

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
			isTimeChanged.value = true;
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

	// https://docs.swmansion.com/react-native-reanimated/docs/2.x/fundamentals/worklets/
	const formatTime = (ms: number) => {
		'worklet';

		const minutes = Math.floor(ms / 60);
		const remainingSeconds = Math.floor(ms % 60);
		const formattedMinutes = String(minutes).padStart(2, '0');
		const formattedSeconds = String(remainingSeconds).padStart(2, '0');
		return `${formattedMinutes}:${formattedSeconds}`;
	};

	useDerivedValue(() => {
		if (isHandlePan.value) {
			const cTime = (x.value * duration.value) / maxWidth.value || 0;
			currentTime.value = cTime;
			current.value = formatTime(cTime);
		} else {
			const xTime = (currentTime.value * maxWidth.value) / duration.value || 0;
			x.value = xTime;
			current.value = formatTime(currentTime.value);
			if (currentTime.value !== 0) {
				isTimeChanged.value = true;
			}
		}
	}, [x, maxWidth, duration, isHandlePan, currentTime]);

	const getCurrentTime = useAnimatedProps(() => {
		if (isTimeChanged.value) {
			return {
				text: current.value
			} as TextInputProps;
		}
		return {
			text: formatTime(duration.value)
		} as TextInputProps;
	}, [current, isTimeChanged, duration]);

	const thumbColor = loaded ? colors.buttonBackgroundPrimaryDefault : colors.tintDisabled;

	return (
		<View style={styles.seekContainer}>
			<AnimatedTextInput
				defaultValue={'00:00'}
				editable={false}
				style={[styles.duration, { color: colors.fontDefault }]}
				animatedProps={getCurrentTime}
			/>
			<View style={styles.seek} onLayout={onLayout}>
				<View style={[styles.line, { backgroundColor: colors.strokeLight }]} />
				<Animated.View style={[styles.line, styleLine, { backgroundColor: colors.buttonBackgroundPrimaryDefault }]} />
				<PanGestureHandler enabled={loaded} onGestureEvent={gestureHandler}>
					<Animated.View
						hitSlop={AUDIO_BUTTON_HIT_SLOP}
						style={[styles.thumbSeek, { backgroundColor: thumbColor }, styleThumb]}
					/>
				</PanGestureHandler>
			</View>
		</View>
	);
};

export default Seek;
