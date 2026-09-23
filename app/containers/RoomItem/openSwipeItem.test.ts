import { openSwipeItemId } from './openSwipeItem';

describe('openSwipeItem', () => {
	afterEach(() => {
		openSwipeItemId.value = null;
	});

	it('starts with no room swiped open', () => {
		expect(openSwipeItemId.value).toBeNull();
	});

	it('tracks a single open room id at a time, replacing the previous one', () => {
		openSwipeItemId.value = 'room-1';
		expect(openSwipeItemId.value).toBe('room-1');

		openSwipeItemId.value = 'room-2';
		expect(openSwipeItemId.value).toBe('room-2');
	});
});
