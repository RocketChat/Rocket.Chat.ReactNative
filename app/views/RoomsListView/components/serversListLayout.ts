// Layout math for the Workspaces (servers list) action sheet, kept dependency-free
// so it can be unit-tested without the redux/database tree the component needs.

import { ACTION_SHEET_MAX_HEIGHT_FRACTION, HANDLE_HEIGHT } from '../../../containers/ActionSheet/useActionSheetDetents';

export const SERVERS_LIST_ROW_HEIGHT = 68;
export const SERVERS_LIST_MAX_ROWS = 4.5;

// Vertical space the sheet reserves for everything that is NOT the scrollable
// server list, so the Add Server button is never pushed off-screen. Built up from
// the real pieces (see ServersList.tsx + RoomsListView/styles.ts) rather than a
// bare guess, so that resizing any of them keeps this in sync. Approximate by
// design — glyph line-height isn't pinned in styles — but a unit test guards the
// total. The two hairline List.Separators are rounded into the text allowance.
const WORKSPACES_HEADER_HEIGHT = 41; // styles.serversListContainerHeader.height
const ADD_SERVER_CONTAINER_PADDING = 16 * 2; // styles.addServerButtonContainer.padding (top + bottom)
const ADD_SERVER_BUTTON_PADDING = 14 * 2; // styles.buttonCreateWorkspace.paddingVertical (top + bottom)
const ADD_SERVER_BUTTON_TEXT_HEIGHT = 21; // ~line-height of the 16px button label
const SERVERS_LIST_RESERVED_HEIGHT =
	WORKSPACES_HEADER_HEIGHT +
	HANDLE_HEIGHT +
	ADD_SERVER_CONTAINER_PADDING +
	ADD_SERVER_BUTTON_PADDING +
	ADD_SERVER_BUTTON_TEXT_HEIGHT;

/**
 * Max height for the servers FlatList. In portrait there is plenty of room, so it
 * stays at the full MAX_ROWS cap (unchanged behaviour). In a short window
 * (landscape, split-view) it shrinks so the header + Add Server button still fit
 * inside the sheet's max height and the list scrolls instead of clipping the
 * button — e.g. landscape with 3+ workspaces connected. Never smaller than one row.
 */
export const getServersListMaxHeight = (windowHeight: number): number => {
	const fullHeight = SERVERS_LIST_MAX_ROWS * SERVERS_LIST_ROW_HEIGHT;
	const availableForList = windowHeight * ACTION_SHEET_MAX_HEIGHT_FRACTION - SERVERS_LIST_RESERVED_HEIGHT;
	return Math.max(SERVERS_LIST_ROW_HEIGHT, Math.min(fullHeight, availableForList));
};
