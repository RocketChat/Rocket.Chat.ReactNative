import { registerOpenSwipeItem, unregisterOpenSwipeItem, closeOpenSwipeItem } from '../openSwipeItem';

describe('closeOpenSwipeItem', () => {
	afterEach(() => {
		unregisterOpenSwipeItem('roomA');
		unregisterOpenSwipeItem('roomB');
	});

	it('closes the open item and reports it was consumed', () => {
		const close = jest.fn();
		registerOpenSwipeItem('roomA', close);

		const consumed = closeOpenSwipeItem('roomB');

		expect(close).toHaveBeenCalledTimes(1);
		expect(consumed).toBe(true);
	});

	it('reports nothing was consumed when no item is open', () => {
		const consumed = closeOpenSwipeItem('roomB');

		expect(consumed).toBe(false);
	});

	it('reports nothing was consumed when closing the same room that is open', () => {
		const close = jest.fn();
		registerOpenSwipeItem('roomA', close);

		const consumed = closeOpenSwipeItem('roomA');

		expect(close).not.toHaveBeenCalled();
		expect(consumed).toBe(false);
	});
});
