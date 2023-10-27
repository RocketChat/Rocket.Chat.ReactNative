import React from 'react';
import { LayoutChangeEvent, View, TextInput, TextInputProps } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, TouchableNativeFeedback } from 'react-native-gesture-handler';
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
import { AUDIO_BUTTON_HIT_SLOP, THUMB_SEEK_SIZE } from './utils';

const DEFAULT_TIME_LABEL = '00:00';

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
	const timePosition = useSharedValue(0);
	const timeLabel = useSharedValue(DEFAULT_TIME_LABEL);
	const scale = useSharedValue(1);
	const isHandlePan = useSharedValue(false);
	const isTimeChanged = useSharedValue(false);

	const styleLine = useAnimatedStyle(() => ({
		width: timePosition.value
	}));

	const styleThumb = useAnimatedStyle(() => ({
		transform: [{ translateX: timePosition.value - THUMB_SEEK_SIZE / 2 }, { scale: scale.value }]
	}));

	const onLayout = (event: LayoutChangeEvent) => {
		const { width } = event.nativeEvent.layout;
		maxWidth.value = width;
	};

	const onGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { offsetX: number }>({
		onStart: (_, ctx) => {
			ctx.offsetX = timePosition.value;
			isHandlePan.value = true;
		},
		onActive: ({ translationX }, ctx) => {
			timePosition.value = clamp(ctx.offsetX + translationX + (THUMB_SEEK_SIZE / 2) * Math.sign(translationX), 0, maxWidth.value);
			isTimeChanged.value = true;
			scale.value = 1.3;
		},
		onEnd: () => {
			scale.value = 1;
			isHandlePan.value = false;
			runOnJS(onChangeTime)(Math.round(currentTime.value * 1000));
		}
	});

	useDerivedValue(() => {
		if (isHandlePan.value) {
			const timeSelected = (timePosition.value * duration.value) / maxWidth.value || 0;
			currentTime.value = timeSelected;
			timeLabel.value = formatTime(timeSelected);
		} else {
			const timeInProgress = (currentTime.value * maxWidth.value) / duration.value || 0;
			timePosition.value = timeInProgress;
			timeLabel.value = formatTime(currentTime.value);
			if (currentTime.value !== 0) {
				isTimeChanged.value = true;
			}
		}
	}, [timePosition, maxWidth, duration, isHandlePan, currentTime]);

	const getCurrentTime = useAnimatedProps(() => {
		if (isTimeChanged.value) {
			return {
				text: timeLabel.value
			} as TextInputProps;
		}
		return {
			text: formatTime(duration.value)
		} as TextInputProps;
	}, [timeLabel, isTimeChanged, duration]);

	const thumbColor = loaded ? colors.buttonBackgroundPrimaryDefault : colors.tintDisabled;

	return (
		<TouchableNativeFeedback>
			<View style={styles.seekContainer}>
				<AnimatedTextInput
					defaultValue={DEFAULT_TIME_LABEL}
					editable={false}
					style={[styles.duration, { color: colors.fontDefault }]}
					animatedProps={getCurrentTime}
				/>
				<View style={styles.seek} onLayout={onLayout}>
					<View style={[styles.line, { backgroundColor: colors.strokeLight }]}>
						<Animated.View style={[styles.line, styleLine, { backgroundColor: colors.buttonBackgroundPrimaryDefault }]} />
					</View>
					<PanGestureHandler enabled={loaded} onGestureEvent={onGestureEvent}>
						<Animated.View
							hitSlop={AUDIO_BUTTON_HIT_SLOP}
							style={[styles.thumbSeek, { backgroundColor: thumbColor }, styleThumb]}
						/>
					</PanGestureHandler>
				</View>
			</View>
		</TouchableNativeFeedback>
	);
};

export default Seek;
