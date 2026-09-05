import { useCallback, useMemo, useRef, useState } from 'react';
import { type FlatListProps, type ViewToken } from 'react-native';
import { type SharedValue, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import dayjs from '../../../../lib/dayjs';
import { type TAnyMessageModel } from '../../../../definitions';

const HIDE_DELAY = 1000;
const FADE_IN_DURATION = 150;
const FADE_OUT_DURATION = 300;

type TViewabilityConfigCallbackPairs = NonNullable<FlatListProps<TAnyMessageModel>['viewabilityConfigCallbackPairs']>;

interface IFloatingDateScrollEvents {
	onBeginDrag: () => void;
	onMomentumBegin: () => void;
	onEndDrag: () => void;
	onMomentumEnd: () => void;
}

interface IUseFloatingDate {
	ts: Date | string | null;
	opacity: SharedValue<number>;
	scrollEvents: IFloatingDateScrollEvents;
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

	const [viewabilityConfigCallbackPairs] = useState<TViewabilityConfigCallbackPairs>(() => [
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

	const show = useCallback((): void => {
		'worklet';

		opacity.set(withTiming(1, { duration: FADE_IN_DURATION }));
	}, [opacity]);

	const hide = useCallback((): void => {
		'worklet';

		opacity.set(withDelay(HIDE_DELAY, withTiming(0, { duration: FADE_OUT_DURATION })));
	}, [opacity]);

	// The pill tracks the gesture, not the offset: onScroll also fires for programmatic scrolls (jump to
	// bottom/message) and for maintainVisibleContentPosition autoscroll at the live tail.
	// Re-setting the shared value cancels the pending animation first, so a drag released into a fling
	// (onEndDrag then onMomentumBegin) cancels the armed fade-out instead of blinking.
	const scrollEvents = useMemo<IFloatingDateScrollEvents>(
		() => ({ onBeginDrag: show, onMomentumBegin: show, onEndDrag: hide, onMomentumEnd: hide }),
		[show, hide]
	);

	return { ts, opacity, scrollEvents, viewabilityConfigCallbackPairs };
};
