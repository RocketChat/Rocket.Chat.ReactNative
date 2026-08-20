import { useState } from 'react';
import { type ViewToken } from 'react-native';

import { type TAnyMessageModel } from '../../../../definitions';

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

export const useFloatingDate = () => {
	const [ts, setTs] = useState<Date | string | null>(null);

	const [viewabilityConfigCallbackPairs] = useState(() => [
		{
			viewabilityConfig: { itemVisiblePercentThreshold: 0 },
			onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken<TAnyMessageModel>[] }) => {
				const next = getTopVisibleTs(viewableItems);
				if (next) {
					setTs(next);
				}
			}
		}
	]);

	return { ts, viewabilityConfigCallbackPairs };
};
