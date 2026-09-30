import { makeMutable, withSpring, type SharedValue } from 'react-native-reanimated';

import { SWIPE_SPRING_CONFIG } from './swipeRelease';

export type SwipeRow = {
	rid: string;
	transX: SharedValue<number>;
	rowOffSet: SharedValue<number>;
};

export const openSwipeItem = makeMutable<SwipeRow | null>(null);

const springRow = ({ transX, rowOffSet }: SwipeRow, restingOffset: number, velocity: number) => {
	'worklet';
	transX.value = withSpring(restingOffset, { ...SWIPE_SPRING_CONFIG, velocity });
	rowOffSet.value = restingOffset;
};

export const unregisterOpenSwipeItem = (rid: string) => {
	'worklet';
	if (openSwipeItem.value?.rid === rid) {
		openSwipeItem.value = null;
	}
};

export const closeOpenSwipeItem = (exceptRid?: string) => {
	'worklet';
	const row = openSwipeItem.value;
	if (!row || row.rid === exceptRid) {
		return false;
	}
	springRow(row, 0, 0);
	openSwipeItem.value = null;
	return true;
};

export const settleSwipeRow = (row: SwipeRow, restingOffset: number, velocity = 0) => {
	'worklet';
	springRow(row, restingOffset, velocity);
	if (restingOffset === 0) {
		unregisterOpenSwipeItem(row.rid);
		return;
	}
	closeOpenSwipeItem(row.rid);
	openSwipeItem.value = row;
};
