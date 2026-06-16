// Layout math for the Workspaces (servers list) action sheet, kept dependency-free
// so it can be unit-tested without the redux/database tree the component needs.

export const SERVERS_LIST_ROW_HEIGHT = 68;
export const SERVERS_LIST_MAX_ROWS = 4.5;

// Vertical space the sheet needs for everything that is NOT the scrollable server
// list: the "Workspaces" header, the separator, the Add Server button block, and
// the sheet handle. Reserved so the button is never pushed off-screen.
const SERVERS_LIST_CHROME_HEIGHT = 150;

// Mirrors ACTION_SHEET_MAX_HEIGHT_FRACTION in useActionSheetDetents: a children
// action sheet can grow to at most this fraction of the window height.
const ACTION_SHEET_MAX_HEIGHT_FRACTION = 0.75;

/**
 * Max height for the servers FlatList. In portrait there is plenty of room, so it
 * stays at the full MAX_ROWS cap (unchanged behaviour). In a short window
 * (landscape, split-view) it shrinks so the header + Add Server button still fit
 * inside the sheet's max height and the list scrolls instead of clipping the
 * button — e.g. landscape with 3+ workspaces connected. Never smaller than one row.
 */
export const getServersListMaxHeight = (windowHeight: number): number => {
	const fullHeight = SERVERS_LIST_MAX_ROWS * SERVERS_LIST_ROW_HEIGHT;
	const availableForList = windowHeight * ACTION_SHEET_MAX_HEIGHT_FRACTION - SERVERS_LIST_CHROME_HEIGHT;
	return Math.max(SERVERS_LIST_ROW_HEIGHT, Math.min(fullHeight, availableForList));
};
