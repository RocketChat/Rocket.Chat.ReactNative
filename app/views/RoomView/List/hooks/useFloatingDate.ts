import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type ViewabilityConfigCallbackPairs, type ViewToken } from '@legendapp/list/react-native';
import { type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import dayjs from '~/lib/dayjs';
import { type TAnyMessageModel } from '~/definitions';

const HIDE_DELAY = 1000;
const FADE_IN_DURATION = 150;
const FADE_OUT_DURATION = 300;

type TViewabilityConfigCallbackPairs = ViewabilityConfigCallbackPairs<TAnyMessageModel>;

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

export const getTopmostViewableTs = (viewableItems: ViewToken<TAnyMessageModel>[]): Date | string | null =>
	viewableItems.reduce<{ index: number; ts: Date | string } | null>((top, { isViewable, index, item }) => {
		if (!isViewable || !item?.ts || index == null) {
			return top;
		}
		return !top || index < top.index ? { index, ts: item.ts } : top;
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
				const next = getTopmostViewableTs(viewableItems);
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

	const scrollEvents = useMemo<IFloatingDateScrollEvents>(
		() => ({ onBeginDrag: showNow, onMomentumBegin: showNow, onEndDrag: hideAfterDelay, onMomentumEnd: hideAfterDelay }),
		[showNow, hideAfterDelay]
	);

	return { ts, opacity, scrollEvents, viewabilityConfigCallbackPairs };
};
