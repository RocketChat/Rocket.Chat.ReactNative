import { expect } from 'e2e';

import { headerItem, LONG_TIMEOUT, roomTitle, tapWhenVisible, type Fixtures } from './flows';

export const tapHeaderItem = (fixtures: Fixtures, testId: string, iosLabel: string | RegExp) =>
	tapWhenVisible(fixtures, headerItem(fixtures, testId, iosLabel));

export const submitSelectedUsers = (fixtures: Fixtures) =>
	tapHeaderItem(fixtures, 'selected-users-view-submit', /^(Next|Skip|Create)$/);

interface HeaderMenuEntry {
	testId: string;
	iosLabel: string;
}

export const selectHeaderMenuOption = async (fixtures: Fixtures, menu: HeaderMenuEntry, option: HeaderMenuEntry) => {
	await tapHeaderItem(fixtures, menu.testId, menu.iosLabel);
	await tapWhenVisible(
		fixtures,
		fixtures.platform === 'ios' ? fixtures.screen.getByText(option.iosLabel).last() : fixtures.screen.getByTestId(option.testId)
	);
};

export const openRoomSearch = async (fixtures: Fixtures) => {
	if (fixtures.platform === 'ios') {
		await tapHeaderItem(fixtures, 'room-view-search', 'More');
		await tapWhenVisible(fixtures, fixtures.screen.getByText('Search messages').last());
	} else {
		await tapWhenVisible(fixtures, 'room-view-search');
	}
};

export const threadsButton = (fixtures: Fixtures) => headerItem(fixtures, 'room-view-header-threads', /^Threads(, .*)?$/);

export const followThreadButton = (fixtures: Fixtures, following: boolean) =>
	following
		? headerItem(fixtures, 'room-view-header-unfollow', 'Unfollow thread')
		: headerItem(fixtures, 'room-view-header-follow', 'Follow thread');

export const expectRoomTitle = (fixtures: Fixtures, title: string | RegExp) =>
	expect(roomTitle(fixtures, title)).toBeVisible({ timeout: LONG_TIMEOUT });
