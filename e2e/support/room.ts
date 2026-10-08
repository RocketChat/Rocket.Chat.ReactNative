import { expect } from 'e2e';

import {
	backToRoomsList,
	confirmAlert,
	expectHidden,
	expectVisible,
	fillSettled,
	type Fixtures,
	isVisibleNow,
	LONG_TIMEOUT,
	openMessageActions,
	openRoomActions,
	searchAndNavigateRoom,
	succeeds,
	tapUntilVisible,
	tapWhenVisible
} from './flows';

export const openNewMessage = async (fixtures: Fixtures) => {
	const createButton = fixtures.screen.getByTestId('rooms-list-view-create-channel').first();
	await expect(createButton).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapUntilVisible(fixtures, createButton, 'new-message-view');
};

export const selectUser = async (fixtures: Fixtures, username: string) => {
	await tapWhenVisible(fixtures, 'select-users-view-search');
	await fillSettled(fixtures.screen.getByTestId('select-users-view-search'), username);
	await tapWhenVisible(fixtures, `select-users-view-item-${username}`);
	await expectVisible(fixtures, `selected-user-${username}`);
};

export const navigateToInfoView = async (fixtures: Fixtures) => {
	await openRoomActions(fixtures);
	await tapWhenVisible(fixtures, 'room-actions-info');
	await expectVisible(fixtures, 'room-info-view');
};

export const navigateToRoomInfo = async (fixtures: Fixtures, room: string) => {
	await searchAndNavigateRoom(fixtures, room);
	await navigateToInfoView(fixtures);
};

export const expandActionSheet = async ({ screen }: Fixtures) => {
	await screen.getByTestId('action-sheet-handle').swipe({ direction: 'down' });
};

const DELETE_CONFIRMATION = /You will not be able to recover this message/;
const DELETE_TAP_ATTEMPTS = 3;
const DELETE_RESPONSE_TIMEOUT = 5_000;

const tapDeleteAction = async ({ screen }: Fixtures) => {
	const deleteAction = screen.getByTestId('message-actions-delete');
	const confirmation = screen.getByText(DELETE_CONFIRMATION).first();
	for (let attempt = 1; attempt <= DELETE_TAP_ATTEMPTS; attempt += 1) {
		if (!(await isVisibleNow(screen.getByTestId('action-sheet')))) {
			return;
		}
		await screen.scrollUntilVisible(deleteAction, { timeout: LONG_TIMEOUT });
		await deleteAction.tap();
		if (await succeeds(expect(confirmation).toBeVisible({ timeout: DELETE_RESPONSE_TIMEOUT }))) {
			return;
		}
	}
};

export const deleteMessage = async (fixtures: Fixtures, message: string) => {
	await openMessageActions(fixtures, message);
	await expandActionSheet(fixtures);
	await tapDeleteAction(fixtures);
	await confirmAlert(fixtures, DELETE_CONFIRMATION, /^Delete$/i);
	await expectHidden(fixtures, `message-content-${message}`);
};

export const expectBadgeClearsAfterOpeningRoom = async (fixtures: Fixtures, roomName: string, badgeTestId: string) => {
	const { screen } = fixtures;
	const row = screen.getByTestId(`rooms-list-view-item-${roomName}`);
	await expect(row).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(row.getByTestId(badgeTestId)).toBeVisible({ timeout: LONG_TIMEOUT });
	await row.tap();
	await expect(screen.getByTestId(`room-view-title-${roomName}`)).toBeVisible({ timeout: LONG_TIMEOUT });
	await backToRoomsList(fixtures);
	await expect(row.getByTestId(badgeTestId)).toBeHidden({ timeout: LONG_TIMEOUT });
};
