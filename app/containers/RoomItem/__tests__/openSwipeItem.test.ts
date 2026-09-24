import { makeMutable } from 'react-native-reanimated';

import { registerOpenSwipeItem, unregisterOpenSwipeItem, closeOpenSwipeItem } from '../openSwipeItem';

const createItem = (rid: string) => ({
	rid,
	transX: makeMutable(80),
	rowState: makeMutable(1),
	rowOffSet: makeMutable(80)
});

describe('closeOpenSwipeItem', () => {
	afterEach(() => {
		unregisterOpenSwipeItem('roomA');
		unregisterOpenSwipeItem('roomB');
	});

	it('closes the open item and reports it was consumed', () => {
		const item = createItem('roomA');
		registerOpenSwipeItem(item);

		const consumed = closeOpenSwipeItem('roomB');

		expect(item.rowState.value).toBe(0);
		expect(item.rowOffSet.value).toBe(0);
		expect(item.transX.value).toBe(0);
		expect(consumed).toBe(true);
	});

	it('reports nothing was consumed when no item is open', () => {
		const consumed = closeOpenSwipeItem('roomB');

		expect(consumed).toBe(false);
	});

	it('reports nothing was consumed when closing the same room that is open', () => {
		const item = createItem('roomA');
		registerOpenSwipeItem(item);

		const consumed = closeOpenSwipeItem('roomA');

		expect(item.rowState.value).toBe(1);
		expect(consumed).toBe(false);
	});

	it('closes the previously open item when another one registers', () => {
		const previous = createItem('roomA');
		registerOpenSwipeItem(previous);

		registerOpenSwipeItem(createItem('roomB'));

		expect(previous.rowState.value).toBe(0);
		expect(previous.transX.value).toBe(0);
	});
});
