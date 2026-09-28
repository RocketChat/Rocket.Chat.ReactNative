import { makeMutable, withSpring, type SharedValue } from 'react-native-reanimated';

import { SWIPE_SPRING_CONFIG } from './styles';
import { type TRowState } from './swipeRelease';

type OpenSwipeItem = {
	rid: string;
	transX: SharedValue<number>;
	rowState: SharedValue<TRowState>;
	rowOffSet: SharedValue<number>;
};

export const openSwipeItem = makeMutable<OpenSwipeItem | null>(null);

export const resetSwipeRow = ({ transX, rowState, rowOffSet }: Omit<OpenSwipeItem, 'rid'>) => {
	'worklet';
	rowState.value = 0;
	transX.value = withSpring(0, SWIPE_SPRING_CONFIG);
	rowOffSet.value = 0;
};

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
		resetSwipeRow(item);
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
