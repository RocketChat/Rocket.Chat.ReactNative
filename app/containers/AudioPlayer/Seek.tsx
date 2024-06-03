import React from 'react';
import { LayoutChangeEvent, View, TextInput, TextInputProps, TouchableNativeFeedback } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
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
import { SEEK_HIT_SLOP, THUMB_SEEK_SIZE, ACTIVE_OFFSET_X, DEFAULT_TIME_LABEL } from './constants';

Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface ISeek {
	duration: SharedValue<number>;
	currentTime: SharedValue<number>;
	loaded: boolean;
	onChangeTime: (time: number) => Promise<void>;
}

function clamp(value: number, min: number, max: number) {
	'worklet';

	return Math.min(Math.max(value, min), max);
}

// https://docs.swmansion.com/react-native-reanimated/docs/2.x/fundamentals/worklets/
const formatTime = (ms: number) => {
	'worklet';

	const minutes = Math.floor(ms / 60);
	const remainingSeconds = Math.floor(ms % 60);
	const formattedMinutes = String(minutes).padStart(2, '0');
	const formattedSeconds = String(remainingSeconds).padStart(2, '0');
	return `${formattedMinutes}:${formattedSeconds}`;
};

const Seek = ({ currentTime, duration, loaded = false, onChangeTime }: ISeek) => {
	const { colors } = useTheme();

	const maxWidth = useSharedValue(1);
	const translateX = useSharedValue(0);
	const timeLabel = useSharedValue(DEFAULT_TIME_LABEL);
	const scale = useSharedValue(1);
	const isPanning = useSharedValue(false);

	const styleLine = useAnimatedStyle(() => ({
		width: translateX.value
	}));

	const styleThumb = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value - THUMB_SEEK_SIZE / 2 }, { scale: scale.value }]
	}));

	const onLayout = (event: LayoutChangeEvent) => {
		const { width } = event.nativeEvent.layout;
		maxWidth.value = width;
	};

	const onGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { offsetX: number }>({
		onStart: (event, ctx) => {
			isPanning.value = true;
			ctx.offsetX = translateX.value;
		},
		onActive: ({ translationX }, ctx) => {
			translateX.value = clamp(ctx.offsetX + translationX, 0, maxWidth.value);
			scale.value = 1.3;
		},
		onFinish() {
			scale.value = 1;
			isPanning.value = false;
			runOnJS(onChangeTime)(Math.round(currentTime.value * 1000));
		}
	});

	useDerivedValue(() => {
		if (isPanning.value) {
			// When the user is panning, always the currentTime.value is been set different from the currentTime provided by
			// the audio in progress
			currentTime.value = (translateX.value * duration.value) / maxWidth.value || 0;
		} else {
			translateX.value = (currentTime.value * maxWidth.value) / duration.value || 0;
		}
		timeLabel.value = formatTime(currentTime.value);
	}, [translateX, maxWidth, duration, isPanning, currentTime]);

	const timeLabelAnimatedProps = useAnimatedProps(() => {
		if (currentTime.value !== 0) {
			return {
				text: timeLabel.value
			} as TextInputProps;
		}
		return {
			text: formatTime(duration.value)
		} as TextInputProps;
	}, [timeLabel, duration, currentTime]);

	const thumbColor = loaded ? colors.buttonBackgroundPrimaryDefault : colors.buttonBackgroundPrimaryDisabled;

	// TouchableNativeFeedback is avoiding do a long press message when seeking the audio
	return (
		<TouchableNativeFeedback>
			<View style={styles.seekContainer}>
				<AnimatedTextInput
					defaultValue={DEFAULT_TIME_LABEL}
					editable={false}
					style={[styles.duration, { color: colors.fontDefault }]}
					animatedProps={timeLabelAnimatedProps}
				/>
				<View style={styles.seek} onLayout={onLayout}>
					<View style={[styles.line, { backgroundColor: colors.strokeLight }]}>
						<Animated.View style={[styles.line, styleLine, { backgroundColor: colors.buttonBackgroundPrimaryDefault }]} />
					</View>
					<PanGestureHandler enabled={loaded} onGestureEvent={onGestureEvent} activeOffsetX={[-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X]}>
						<Animated.View hitSlop={SEEK_HIT_SLOP} style={[styles.thumbSeek, { backgroundColor: thumbColor }, styleThumb]} />
					</PanGestureHandler>
				</View>
			</View>
		</TouchableNativeFeedback>
	);
};

export default Seek;
