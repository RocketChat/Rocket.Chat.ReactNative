import { useCallback, useRef, useState } from 'react';
import { type FlatListProps, type ViewToken } from 'react-native';
import { type SharedValue, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import dayjs from '../../../../lib/dayjs';
import { type TAnyMessageModel } from '../../../../definitions';

const HIDE_DELAY = 1000;
const FADE_IN_DURATION = 150;
const FADE_OUT_DURATION = 300;

type TViewabilityConfigCallbackPairs = NonNullable<FlatListProps<TAnyMessageModel>['viewabilityConfigCallbackPairs']>;

interface IUseFloatingDate {
	ts: Date | string | null;
	opacity: SharedValue<number>;
	show: () => void;
	viewabilityConfigCallbackPairs: TViewabilityConfigCallbackPairs;
}

export const getHighestIndexViewableTs = (viewableItems: ViewToken<TAnyMessageModel>[]): Date | string | null =>
	viewableItems.reduce<{ index: number; ts: Date | string } | null>((top, { isViewable, index, item }) => {
		if (!isViewable || !item?.ts || index == null) {
			return top;
		}
		return !top || index > top.index ? { index, ts: item.ts } : top;
	}, null)?.ts ?? null;

export const useFloatingDate = (): IUseFloatingDate => {
	const [ts, setTs] = useState<Date | string | null>(null);
	const dayKey = useRef<string | null>(null);
	const opacity = useSharedValue(0);
	const isFadingIn = useSharedValue(false);

	const { current: viewabilityConfigCallbackPairs } = useRef<TViewabilityConfigCallbackPairs>([
		{
			viewabilityConfig: { itemVisiblePercentThreshold: 0 },
			onViewableItemsChanged: ({ viewableItems }) => {
				const next = getHighestIndexViewableTs(viewableItems);
				// keep the previous date when a fast fling outruns rendering and the batch comes back empty,
				// so the pill doesn't unmount mid-fade and snap back at full opacity
				if (!next) {
					return;
				}
				const nextDayKey = dayjs(next).format('L');
				if (nextDayKey === dayKey.current) {
					return;
				}
				dayKey.current = nextDayKey;
				setTs(next);
			}
		}
	]);

	const hide = useCallback((): void => {
		'worklet';

		opacity.set(withDelay(HIDE_DELAY, withTiming(0, { duration: FADE_OUT_DURATION })));
	}, [opacity]);

	const show = useCallback((): void => {
		'worklet';

		if (isFadingIn.get()) {
			return;
		}
		if (opacity.get() === 1) {
			hide();
			return;
		}
		isFadingIn.set(true);
		opacity.set(
			withTiming(1, { duration: FADE_IN_DURATION }, (): void => {
				isFadingIn.set(false);
				hide();
			})
		);
	}, [hide, isFadingIn, opacity]);

	return { ts, opacity, show, viewabilityConfigCallbackPairs };
};
