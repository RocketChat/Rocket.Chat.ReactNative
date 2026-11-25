import { I18nManager, type LayoutChangeEvent, Text, View } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import { type SharedValue, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import styles from './styles';
import { useTheme } from '~/theme';
import { SCROLL_FAIL_OFFSET_Y, SCRUB_ACTIVE_OFFSET_X, SEEK_TAP_MAX_DURATION_MS } from './constants';
import { clamp } from './playbackClock';
import { formatProgressLabel } from './formatMediaTime';
import Waveform from '../Waveform';
import { useSeekAccessibility } from './hooks/useSeekAccessibility';
import { useShownTime } from './hooks/useShownTime';

const NOT_SCRUBBING = -1;

const keepTouchFromMessage = () => true;

interface ISeek {
	duration: SharedValue<number>;
	currentTime: SharedValue<number>;
	loaded: boolean;
	peaks?: number[];
	onChangeTime: (time: number) => void;
}

const Seek = ({ currentTime, duration, loaded = false, peaks, onChangeTime }: ISeek) => {
	const { colors } = useTheme();

	const { isRTL } = I18nManager;
	const trackWidth = useSharedValue(1);
	const scrubProgress = useSharedValue(NOT_SCRUBBING);

	const progress = useDerivedValue(() => {
		if (scrubProgress.get() !== NOT_SCRUBBING) {
			return scrubProgress.get();
		}
		return duration.get() ? clamp(currentTime.get() / duration.get(), 0, 1) : 0;
	});

	const shownSeconds = useDerivedValue(() => {
		if (scrubProgress.get() !== NOT_SCRUBBING) {
			return scrubProgress.get() * duration.get();
		}
		return clamp(currentTime.get(), 0, duration.get());
	});

	const progressAt = (x: number) => {
		'worklet';

		const fromLeft = clamp(x / trackWidth.get(), 0, 1);
		return isRTL ? 1 - fromLeft : fromLeft;
	};

	const timeAt = (x: number) => {
		'worklet';

		return progressAt(x) * duration.get();
	};

	const finishSeek = (time: number) => {
		onChangeTime(time);
		scheduleOnUI(() => {
			'worklet';

			scrubProgress.set(NOT_SCRUBBING);
		});
	};

	const onLayout = (event: LayoutChangeEvent) => {
		trackWidth.set(event.nativeEvent.layout.width || 1);
	};

	const panGesture = usePanGesture({
		enabled: loaded,
		activeOffsetX: [-SCRUB_ACTIVE_OFFSET_X, SCRUB_ACTIVE_OFFSET_X],
		failOffsetY: [-SCROLL_FAIL_OFFSET_Y, SCROLL_FAIL_OFFSET_Y],
		onActivate: event => {
			scrubProgress.set(progressAt(event.x));
		},
		onUpdate: event => {
			scrubProgress.set(progressAt(event.x));
		},
		onFinalize: event => {
			if (scrubProgress.get() === NOT_SCRUBBING) return;
			if (event.canceled) {
				scrubProgress.set(NOT_SCRUBBING);
				return;
			}
			scheduleOnRN(finishSeek, timeAt(event.x));
		}
	});

	const tapGesture = useTapGesture({
		enabled: loaded,
		maxDeltaX: SCRUB_ACTIVE_OFFSET_X,
		maxDeltaY: SCROLL_FAIL_OFFSET_Y,
		maxDuration: SEEK_TAP_MAX_DURATION_MS,
		onDeactivate: event => {
			if (!event.canceled) {
				scheduleOnRN(finishSeek, timeAt(event.x));
			}
		}
	});

	const seekGesture = useCompetingGestures(panGesture, tapGesture);
	const { shownTime, showTime } = useShownTime(shownSeconds, duration);
	const seekAccessibility = useSeekAccessibility({ shownSeconds, duration, shownTime, showTime, enabled: loaded, onChangeTime });

	return (
		<>
			<View
				testID='audio-seek'
				style={styles.seek}
				accessible={seekAccessibility.accessible}
				accessibilityRole={seekAccessibility.accessibilityRole}
				accessibilityLabel={seekAccessibility.accessibilityLabel}
				accessibilityValue={seekAccessibility.accessibilityValue}
				accessibilityState={seekAccessibility.accessibilityState}
				accessibilityActions={seekAccessibility.accessibilityActions}
				onAccessibilityAction={seekAccessibility.onAccessibilityAction}>
				<GestureDetector gesture={seekGesture}>
					<View
						testID='audio-seek-track'
						style={styles.seekTrack}
						onLayout={onLayout}
						onStartShouldSetResponder={keepTouchFromMessage}>
						<Waveform peaks={peaks} progress={progress} />
					</View>
				</GestureDetector>
			</View>
			<Text testID='audio-time' numberOfLines={1} style={[styles.timeLabel, { color: colors.fontSecondaryInfo }]}>
				{formatProgressLabel(shownTime.time, shownTime.duration)}
			</Text>
		</>
	);
};

export default Seek;
