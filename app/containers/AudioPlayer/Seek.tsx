import { type LayoutChangeEvent, View, TextInput, type TextInputProps, TouchableNativeFeedback } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { type SharedValue, useAnimatedProps, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import styles from './styles';
import { useTheme } from '~/theme';
import { ACTIVE_OFFSET_X } from './constants';
import { formatProgressLabel } from './formatMediaTime';
import Waveform from '../Waveform';
import { useSeekAccessibility } from './hooks/useSeekAccessibility';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const NOT_SCRUBBING = -1;

interface ISeek {
	duration: SharedValue<number>;
	currentTime: SharedValue<number>;
	loaded: boolean;
	peaks?: number[] | null;
	onChangeTime: (time: number) => void;
}

function clamp(value: number, min: number, max: number) {
	'worklet';

	return Math.min(Math.max(value, min), max);
}

const Seek = ({ currentTime, duration, loaded = false, peaks, onChangeTime }: ISeek) => {
	const { colors } = useTheme();

	const trackWidth = useSharedValue(1);
	const scrubProgress = useSharedValue(NOT_SCRUBBING);

	const progress = useDerivedValue(() => {
		if (scrubProgress.get() !== NOT_SCRUBBING) {
			return scrubProgress.get();
		}
		return duration.get() ? clamp(currentTime.get() / duration.get(), 0, 1) : 0;
	});

	const progressAt = (x: number) => {
		'worklet';

		return clamp(x / trackWidth.get(), 0, 1);
	};

	const seekTo = (fraction: number) => {
		'worklet';

		scheduleOnRN(onChangeTime, fraction * duration.get());
	};

	const onLayout = (event: LayoutChangeEvent) => {
		trackWidth.set(event.nativeEvent.layout.width || 1);
	};

	const panGesture = usePanGesture({
		enabled: loaded,
		activeOffsetX: [-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X],
		onActivate: event => {
			scrubProgress.set(progressAt(event.x));
		},
		onUpdate: event => {
			scrubProgress.set(progressAt(event.x));
		},
		onFinalize: event => {
			if (scrubProgress.get() === NOT_SCRUBBING) return;
			scrubProgress.set(NOT_SCRUBBING);
			if (!event.canceled) {
				seekTo(progressAt(event.x));
			}
		}
	});

	const tapGesture = useTapGesture({
		enabled: loaded,
		onDeactivate: event => {
			if (!event.canceled) {
				seekTo(progressAt(event.x));
			}
		}
	});

	const seekGesture = useCompetingGestures(panGesture, tapGesture);
	const accessibilityProps = useSeekAccessibility({ progress, duration, enabled: loaded, onChangeTime });

	const timeLabelAnimatedProps = useAnimatedProps(() => {
		return { text: formatProgressLabel(progress.get() * duration.get(), duration.get()) } as TextInputProps;
	});

	// TouchableNativeFeedback is avoiding do a long press message when seeking the audio
	return (
		<TouchableNativeFeedback>
			<View style={styles.seekContainer}>
				<GestureDetector gesture={seekGesture}>
					<View testID='audio-seek' style={styles.seek} onLayout={onLayout} {...accessibilityProps}>
						<Waveform peaks={peaks} progress={progress} />
					</View>
				</GestureDetector>
				<AnimatedTextInput
					defaultValue={formatProgressLabel(0, 0)}
					editable={false}
					style={[styles.timeLabel, { color: colors.fontSecondaryInfo }]}
					animatedProps={timeLabelAnimatedProps}
				/>
			</View>
		</TouchableNativeFeedback>
	);
};

export default Seek;
