import { beginNestedPress, endNestedPress, isNestedPressActive } from './nestedPress';

describe('nestedPress', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		endNestedPress();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('reports no active press before any press', () => {
		expect(isNestedPressActive()).toBe(false);
	});

	it('reports an active press while a nested target owns the touch', () => {
		beginNestedPress();

		expect(isNestedPressActive()).toBe(true);
	});

	it('stays active past the long press delay so the row can still be suppressed', () => {
		beginNestedPress();
		jest.advanceTimersByTime(500);

		expect(isNestedPressActive()).toBe(true);
	});

	it('goes inactive once the press ends', () => {
		beginNestedPress();
		endNestedPress();

		expect(isNestedPressActive()).toBe(false);
	});

	it('expires a press that never ended, so a missed release cannot wedge long press', () => {
		beginNestedPress();
		jest.advanceTimersByTime(1000);

		expect(isNestedPressActive()).toBe(false);
	});

	it('restarts cleanly on a subsequent press', () => {
		beginNestedPress();
		jest.advanceTimersByTime(1000);
		beginNestedPress();

		expect(isNestedPressActive()).toBe(true);
	});
});
