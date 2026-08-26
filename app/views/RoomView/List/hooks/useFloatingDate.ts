import { useState } from 'react';
import { type FlatListProps, type ViewToken } from 'react-native';
import { type SharedValue, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

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

// The list is inverted, so the topmost visible row is the one with the highest index.
export const getTopVisibleTs = (viewableItems: ViewToken<TAnyMessageModel>[]): Date | string | null => {
	let top: ViewToken<TAnyMessageModel> | undefined;
	viewableItems.forEach(token => {
		if (!token.isViewable || !token.item?.ts || token.index == null) {
			return;
		}
		if (!top || token.index > top.index!) {
			top = token;
		}
	});
	return top?.item.ts || null;
};

export const useFloatingDate = (): IUseFloatingDate => {
	const [ts, setTs] = useState<Date | string | null>(null);
	const opacity = useSharedValue(0);
	const isFadingIn = useSharedValue(false);

	const [viewabilityConfigCallbackPairs] = useState<TViewabilityConfigCallbackPairs>(() => [
		{
			viewabilityConfig: { itemVisiblePercentThreshold: 0 },
			onViewableItemsChanged: ({ viewableItems }) => {
				const next = getTopVisibleTs(viewableItems);
				if (next) {
					setTs(next);
				}
			}
		}
	]);

	const hide = (): void => {
		'worklet';

		opacity.set(withDelay(HIDE_DELAY, withTiming(0, { duration: FADE_OUT_DURATION })));
	};

	const show = (): void => {
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
	};

	return { ts, opacity, show, viewabilityConfigCallbackPairs };
};
