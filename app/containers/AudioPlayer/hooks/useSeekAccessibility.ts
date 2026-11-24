import { type AccessibilityActionEvent } from 'react-native';
import { type SharedValue } from 'react-native-reanimated';

import i18n from '~/i18n';
import { formatMediaTime } from '../formatMediaTime';
import { type IShownTime } from './useShownTime';

export const SEEK_STEP_SECONDS = 5;

const ACCESSIBILITY_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }];

const STEP_BY_ACTION: Record<string, number> = {
	increment: SEEK_STEP_SECONDS,
	decrement: -SEEK_STEP_SECONDS
};

interface ISeekAccessibility {
	shownSeconds: SharedValue<number>;
	duration: SharedValue<number>;
	shownTime: IShownTime;
	showTime: (time: number, total: number) => void;
	enabled: boolean;
	onChangeTime: (time: number) => void;
}

export const useSeekAccessibility = ({
	shownSeconds,
	duration,
	shownTime,
	showTime,
	enabled,
	onChangeTime
}: ISeekAccessibility) => {
	const onAccessibilityAction = (event: AccessibilityActionEvent) => {
		const step = STEP_BY_ACTION[event.nativeEvent.actionName];
		const total = duration.get();
		if (!enabled || !step || !total) {
			return;
		}
		const time = Math.min(Math.max(shownSeconds.get() + step, 0), total);
		showTime(time, total);
		onChangeTime(time);
	};

	return {
		accessible: true,
		accessibilityRole: 'adjustable' as const,
		accessibilityLabel: i18n.t('Audio_position'),
		accessibilityValue: shownTime.duration
			? {
					text: i18n.t('Audio_position_value', {
						current: formatMediaTime(shownTime.time),
						total: formatMediaTime(shownTime.duration)
					})
				}
			: undefined,
		accessibilityActions: ACCESSIBILITY_ACTIONS,
		onAccessibilityAction
	};
};
