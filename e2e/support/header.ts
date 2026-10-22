import { expect } from 'e2e';

import { headerItem, LONG_TIMEOUT, roomTitle, tapWhenVisible, type Fixtures } from './flows';

export const tapHeaderItem = (fixtures: Fixtures, testId: string, iosLabel: string | RegExp) =>
	tapWhenVisible(fixtures, headerItem(fixtures, testId, iosLabel));

export const submitSelectedUsers = (fixtures: Fixtures) =>
	tapHeaderItem(fixtures, 'selected-users-view-submit', /^(Next|Skip|Create)$/);

interface HeaderMenuEntry {
	testId: string;
	iosLabel: string | RegExp;
}

const ROOM_MENU: HeaderMenuEntry = { testId: 'room-view-header-kebab', iosLabel: /^More/ };

const ROOM_SEARCH: HeaderMenuEntry = { testId: 'room-view-search', iosLabel: 'Search messages' };

const headerMenuOption = ({ screen, platform }: Fixtures, option: HeaderMenuEntry) =>
	platform === 'ios' ? screen.getByText(option.iosLabel).last() : screen.getByTestId(option.testId);

export const selectHeaderMenuOption = async (fixtures: Fixtures, menu: HeaderMenuEntry, option: HeaderMenuEntry) => {
	await tapHeaderItem(fixtures, menu.testId, menu.iosLabel);
	await tapWhenVisible(fixtures, headerMenuOption(fixtures, option));
};

export const selectRoomMenuOption = (fixtures: Fixtures, option: HeaderMenuEntry) =>
	selectHeaderMenuOption(fixtures, ROOM_MENU, option);

export const openRoomSearch = (fixtures: Fixtures) => selectRoomMenuOption(fixtures, ROOM_SEARCH);

const roomMenuButton = (fixtures: Fixtures) => headerItem(fixtures, ROOM_MENU.testId, ROOM_MENU.iosLabel);

export const expectRoomMenuOptions = async (fixtures: Fixtures, options: readonly HeaderMenuEntry[]) => {
	const { screen, platform } = fixtures;
	await tapWhenVisible(fixtures, roomMenuButton(fixtures));
	for (const option of [...options, ROOM_SEARCH]) {
		await expect(headerMenuOption(fixtures, option)).toBeVisible({ timeout: LONG_TIMEOUT });
	}
	if (platform === 'android') {
		await screen.getByTestId('action-sheet-handle').tap();
	} else {
		const roomViewBox = await screen.getByTestId('room-view').first().boundingBox();
		if (roomViewBox) {
			await screen.tapAt({ x: roomViewBox.x + roomViewBox.width / 2, y: roomViewBox.y + roomViewBox.height * 0.8 });
		}
	}
	await expect(headerMenuOption(fixtures, ROOM_SEARCH)).toBeHidden({ timeout: LONG_TIMEOUT });
};

export const threadsButton = (fixtures: Fixtures) => headerItem(fixtures, 'room-view-header-threads', /^Threads(, .*)?$/);

export const followThreadButton = (fixtures: Fixtures, following: boolean) =>
	following
		? headerItem(fixtures, 'room-view-header-unfollow', 'Unfollow thread')
		: headerItem(fixtures, 'room-view-header-follow', 'Follow thread');

export const expectRoomTitle = (fixtures: Fixtures, title: string | RegExp) =>
	expect(roomTitle(fixtures, title)).toBeVisible({ timeout: LONG_TIMEOUT });
