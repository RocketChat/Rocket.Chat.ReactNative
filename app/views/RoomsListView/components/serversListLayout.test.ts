import { getServersListMaxHeight, SERVERS_LIST_MAX_ROWS, SERVERS_LIST_ROW_HEIGHT } from './serversListLayout';

const fullHeight = SERVERS_LIST_MAX_ROWS * SERVERS_LIST_ROW_HEIGHT;

describe('getServersListMaxHeight', () => {
	test('caps at the full MAX_ROWS height in a tall portrait window', () => {
		// iPhone-ish portrait: plenty of room, behaviour stays unchanged
		expect(getServersListMaxHeight(844)).toBe(fullHeight);
	});

	test('returns the full height exactly at the boundary where the list fits', () => {
		// windowHeight * 0.75 - 150 === 306  =>  windowHeight === 608
		expect(getServersListMaxHeight(608)).toBe(fullHeight);
	});

	test('shrinks below the full height in a short window so the button still fits', () => {
		// landscape-ish height: 390 * 0.75 - 150 = 142.5
		const result = getServersListMaxHeight(390);
		expect(result).toBe(142.5);
		expect(result).toBeLessThan(fullHeight);
		expect(result).toBeGreaterThan(SERVERS_LIST_ROW_HEIGHT);
	});

	test('never shrinks below a single row height in a very short window', () => {
		// 200 * 0.75 - 150 = 0, clamped up to one row
		expect(getServersListMaxHeight(200)).toBe(SERVERS_LIST_ROW_HEIGHT);
	});

	test('floors at a single row height for a zero/degenerate window height', () => {
		expect(getServersListMaxHeight(0)).toBe(SERVERS_LIST_ROW_HEIGHT);
	});
});
