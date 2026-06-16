import { getServersListMaxHeight, SERVERS_LIST_MAX_ROWS, SERVERS_LIST_ROW_HEIGHT } from './serversListLayout';

const FULL_HEIGHT = SERVERS_LIST_MAX_ROWS * SERVERS_LIST_ROW_HEIGHT;

// Reserve for the Workspaces header + separator + Add Server button + sheet handle.
// Must match SERVERS_LIST_CHROME_HEIGHT in serversListLayout.ts.
const CHROME = 150;
const SHEET_MAX_FRACTION = 0.75;

describe('getServersListMaxHeight', () => {
	it('keeps the full MAX_ROWS height in portrait (plenty of room)', () => {
		// iPhone-ish portrait height
		expect(getServersListMaxHeight(844)).toBe(FULL_HEIGHT);
		// Tall window is still capped at the row max, not the window
		expect(getServersListMaxHeight(2000)).toBe(FULL_HEIGHT);
	});

	it('shrinks the list in a short (landscape) window so the Add Server button still fits', () => {
		const landscapeHeight = 390; // phone landscape
		const maxHeight = getServersListMaxHeight(landscapeHeight);

		// Constrained below the full height...
		expect(maxHeight).toBeLessThan(FULL_HEIGHT);
		// ...so that list + chrome fits within the sheet's max height (button not clipped).
		expect(maxHeight + CHROME).toBeLessThanOrEqual(landscapeHeight * SHEET_MAX_FRACTION);
	});

	it('regression: 3 workspaces in landscape leave the Add Server button visible', () => {
		const landscapeHeight = 390;
		const threeRows = 3 * SERVERS_LIST_ROW_HEIGHT; // 204, what the old fixed 306 cap would have shown
		const maxHeight = getServersListMaxHeight(landscapeHeight);

		// The list is capped shorter than 3 full rows, so it scrolls instead of pushing
		// the button off-screen — the bug being fixed.
		expect(maxHeight).toBeLessThan(threeRows);
		expect(maxHeight + CHROME).toBeLessThanOrEqual(landscapeHeight * SHEET_MAX_FRACTION);
	});

	it('never collapses below a single row', () => {
		// Even an extremely short window keeps at least one row visible.
		expect(getServersListMaxHeight(100)).toBe(SERVERS_LIST_ROW_HEIGHT);
		expect(getServersListMaxHeight(0)).toBe(SERVERS_LIST_ROW_HEIGHT);
	});
});
