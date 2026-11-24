import { useState } from 'react';
import { type AccessibilityActionEvent } from 'react-native';
import { type SharedValue, useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import i18n from '~/i18n';
import { useIsScreenReaderEnabled } from '~/lib/hooks/useIsScreenReaderEnabled';
import { formatMediaTime } from '../formatMediaTime';

export const SEEK_STEP_SECONDS = 5;

const ACCESSIBILITY_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }];

const STEP_BY_ACTION: Record<string, number> = {
	increment: SEEK_STEP_SECONDS,
	decrement: -SEEK_STEP_SECONDS
};

interface ISeekAccessibility {
	progress: SharedValue<number>;
	duration: SharedValue<number>;
	enabled: boolean;
	onChangeTime: (time: number) => void;
}

export const useSeekAccessibility = ({ progress, duration, enabled, onChangeTime }: ISeekAccessibility) => {
	const screenReaderEnabled = useIsScreenReaderEnabled();
	const [announced, setAnnounced] = useState({ time: 0, duration: 0 });

	const announce = (time: number, total: number) => setAnnounced({ time, duration: total });

	useAnimatedReaction(
		() => {
			if (!screenReaderEnabled) {
				return null;
			}
			return { time: Math.floor(progress.get() * duration.get()), total: Math.floor(duration.get()) };
		},
		(current, previous) => {
			if (current && (current.time !== previous?.time || current.total !== previous?.total)) {
				scheduleOnRN(announce, current.time, current.total);
			}
		},
		[screenReaderEnabled]
	);

	const onAccessibilityAction = (event: AccessibilityActionEvent) => {
		const step = STEP_BY_ACTION[event.nativeEvent.actionName];
		const total = duration.get();
		if (!enabled || !step || !total) {
			return;
		}
		const time = Math.min(Math.max(progress.get() * total + step, 0), total);
		announce(time, total);
		onChangeTime(time);
	};

	return {
		accessible: true,
		accessibilityRole: 'adjustable' as const,
		accessibilityLabel: i18n.t('Audio_position'),
		accessibilityValue: announced.duration
			? {
					text: i18n.t('Audio_position_value', {
						current: formatMediaTime(announced.time),
						total: formatMediaTime(announced.duration)
					})
				}
			: undefined,
		accessibilityActions: ACCESSIBILITY_ACTIONS,
		onAccessibilityAction
	};
};
