import { makeMutable, withSpring, type SharedValue } from 'react-native-reanimated';

import { SWIPE_SPRING_CONFIG } from './styles';

type OpenSwipeItem = {
	rid: string;
	transX: SharedValue<number>;
	rowState: SharedValue<number>;
	rowOffSet: SharedValue<number>;
};

export const openSwipeItem = makeMutable<OpenSwipeItem | null>(null);

export const unregisterOpenSwipeItem = (rid: string) => {
	'worklet';
	if (openSwipeItem.value?.rid === rid) {
		openSwipeItem.value = null;
	}
};

export const closeOpenSwipeItem = (exceptRid?: string) => {
	'worklet';
	const item = openSwipeItem.value;
	if (item && item.rid !== exceptRid) {
		item.rowState.value = 0;
		item.transX.value = withSpring(0, SWIPE_SPRING_CONFIG);
		item.rowOffSet.value = 0;
		openSwipeItem.value = null;
		return true;
	}
	return false;
};

export const registerOpenSwipeItem = (item: OpenSwipeItem) => {
	'worklet';
	closeOpenSwipeItem(item.rid);
	openSwipeItem.value = item;
};
