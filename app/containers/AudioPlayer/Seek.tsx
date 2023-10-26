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
import { AUDIO_BUTTON_HIT_SLOP, THUMB_SEEK_SIZE } from './utils';

const DEFAULT_TIME_LABEL = '00:00';

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
	const timePosition = useSharedValue(0);
	const timeLabel = useSharedValue(DEFAULT_TIME_LABEL);
	const scale = useSharedValue(1);
	const onEndGestureHandler = useSharedValue(false);
	const isTimeChanged = useSharedValue(false);

	const styleLine = useAnimatedStyle(() => ({
		width: timePosition.value
	}));

	const styleThumb = useAnimatedStyle(() => ({
		transform: [{ translateX: timePosition.value }, { scale: scale.value }]
	}));

	const onLayout = (event: LayoutChangeEvent) => {
		const { width } = event.nativeEvent.layout;
		maxWidth.value = width - THUMB_SEEK_SIZE;
	};

	const onGestureEvent = useAnimatedGestureHandler({
		onStart: (_, ctx: any) => {
			ctx.startX = timePosition.value;
		},
		onActive: (event, ctx: any) => {
			const moveInX: number = ctx.startX + event.translationX;
			if (moveInX < 0) {
				timePosition.value = 0;
			} else if (moveInX > maxWidth.value) {
				timePosition.value = maxWidth.value;
			} else {
				timePosition.value = moveInX;
			}
			isTimeChanged.value = true;
			scale.value = 1.3;
			currentTime.value = (timePosition.value * duration.value) / maxWidth.value || 0;
		},
		onEnd: () => {
			scale.value = 1;
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
		const timeInProgress = (currentTime.value * maxWidth.value) / duration.value || 0;
		timePosition.value = timeInProgress;
		if (currentTime.value !== 0) {
			isTimeChanged.value = true;
		}
		timeLabel.value = formatTime(currentTime.value);
	}, [timePosition, maxWidth, duration, currentTime]);

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
	);
};

export default Seek;
