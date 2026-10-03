import { expect } from 'e2e';

import {
	backToRoomsList,
	confirmAlert,
	expectHidden,
	expectVisible,
	fillSettled,
	type Fixtures,
	LONG_TIMEOUT,
	openMessageActions,
	openRoomActions,
	searchAndNavigateRoom,
	tapWhenVisible
} from './flows';

export const openNewMessage = async (fixtures: Fixtures) => {
	await tapWhenVisible(fixtures, 'rooms-list-view-create-channel');
	await expectVisible(fixtures, 'new-message-view');
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

export const deleteMessage = async (fixtures: Fixtures, message: string) => {
	const { screen } = fixtures;
	const deleteAction = screen.getByTestId('message-actions-delete');
	await openMessageActions(fixtures, message);
	await expandActionSheet(fixtures);
	await screen.scrollUntilVisible(deleteAction, { timeout: LONG_TIMEOUT });
	await deleteAction.tap();
	await confirmAlert(fixtures, /You will not be able to recover this message/, /^Delete$/i);
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
