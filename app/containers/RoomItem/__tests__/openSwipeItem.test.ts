import { makeMutable } from 'react-native-reanimated';

import { settleSwipeRow, unregisterOpenSwipeItem, closeOpenSwipeItem } from '../openSwipeItem';

const createRow = (rid: string) => ({
	rid,
	transX: makeMutable(0),
	rowOffSet: makeMutable(0)
});

describe('openSwipeItem', () => {
	afterEach(() => {
		unregisterOpenSwipeItem('roomA');
		unregisterOpenSwipeItem('roomB');
	});

	it('closes the open row and reports it was consumed', () => {
		const row = createRow('roomA');
		settleSwipeRow(row, 80);

		const consumed = closeOpenSwipeItem('roomB');

		expect(row.rowOffSet.value).toBe(0);
		expect(row.transX.value).toBe(0);
		expect(consumed).toBe(true);
	});

	it('reports nothing was consumed when no row is open', () => {
		expect(closeOpenSwipeItem('roomB')).toBe(false);
	});

	it('reports nothing was consumed when closing the same room that is open', () => {
		const row = createRow('roomA');
		settleSwipeRow(row, 80);

		const consumed = closeOpenSwipeItem('roomA');

		expect(row.rowOffSet.value).toBe(80);
		expect(consumed).toBe(false);
	});

	it('closes the previously open row when another one opens', () => {
		const previous = createRow('roomA');
		settleSwipeRow(previous, 80);

		settleSwipeRow(createRow('roomB'), -160);

		expect(previous.rowOffSet.value).toBe(0);
		expect(previous.transX.value).toBe(0);
	});

	it('forgets a row once it settles closed', () => {
		const row = createRow('roomA');
		settleSwipeRow(row, 80);

		settleSwipeRow(row, 0);

		expect(closeOpenSwipeItem('roomB')).toBe(false);
	});
});
