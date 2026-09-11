import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type FlatListProps, type ViewToken } from 'react-native';
import { type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

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
	const isShown = useRef(false);
	const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

	const cancelHide = useCallback((): void => {
		if (hideTimeout.current) {
			clearTimeout(hideTimeout.current);
			hideTimeout.current = null;
		}
	}, []);

	const showNow = useCallback((): void => {
		cancelHide();
		if (isShown.current) {
			return;
		}
		isShown.current = true;
		opacity.set(withTiming(1, { duration: FADE_IN_DURATION }));
	}, [cancelHide, opacity]);

	const hideAfterDelay = useCallback((): void => {
		cancelHide();
		hideTimeout.current = setTimeout(() => {
			hideTimeout.current = null;
			isShown.current = false;
			opacity.set(withTiming(0, { duration: FADE_OUT_DURATION }));
		}, HIDE_DELAY);
	}, [cancelHide, opacity]);

	useEffect(() => cancelHide, [cancelHide]);

	const show = useCallback((): void => {
		'worklet';

		scheduleOnRN(showNow);
	}, [showNow]);

	const hide = useCallback((): void => {
		'worklet';

		scheduleOnRN(hideAfterDelay);
	}, [hideAfterDelay]);

	const scrollEvents = useMemo<IFloatingDateScrollEvents>(
		() => ({ onBeginDrag: show, onMomentumBegin: show, onEndDrag: hide, onMomentumEnd: hide }),
		[show, hide]
	);

	return { ts, opacity, scrollEvents, viewabilityConfigCallbackPairs };
};
