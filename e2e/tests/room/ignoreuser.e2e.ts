import { afterEach, test } from '~e2e/support/fixtures';
import { expect } from 'e2e';

import { openRoom } from '~e2e/support/appduct';
import { createDM, createRandomRoom, createUser, deleteCreatedUsers, sendMessage } from '~e2e/support/api';
import {
	hideKeyboard,
	loginWithDeepLink,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenVisible,
	backToRoomsList,
	goBackThrough,
	expectVisible,
	tapUntilVisible,
	fillWhenUncovered
} from '~e2e/support/flows';
import { expectRoomTitle } from '~e2e/support/header';
import { navigateToInfoView } from '~e2e/support/room';

afterEach(deleteCreatedUsers);

const INFO_VIA_ACTIONS_TO_ROOMS_LIST = ['room-actions-view', 'room-view', 'rooms-list-view'];
const INFO_VIA_MESSAGE_TO_ROOMS_LIST = ['room-view', 'rooms-list-view'];

const toggleUserAction = async ({ screen }: Fixtures, action: string, toggledAction: string) => {
	await expect(screen.getByText(action).first()).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('room-info-view-ignore').tap();
	await expect(screen.getByText(toggledAction).first()).toBeVisible({ timeout: LONG_TIMEOUT });
};

const openUserInfoFromMessage = async (fixtures: Fixtures, username: string) => {
	const { screen, platform } = fixtures;
	const usernameHeader = screen.getByTestId(`username-header-${username}`).first();
	await expect(usernameHeader).toBeVisible({ timeout: LONG_TIMEOUT });
	const usernameTarget = platform === 'android' ? screen.getByText(username).first() : usernameHeader;
	await tapUntilVisible(fixtures, usernameTarget, 'room-info-view');
};

const reportUser = async (fixtures: Fixtures, roomTitle: string) => {
	await tapWhenVisible(fixtures, 'room-info-view-warning');
	await expectVisible(fixtures, 'report-user-view');
	await tapWhenVisible(fixtures, 'report-user-view-input');
	await fillWhenUncovered(fixtures.screen.getByTestId('report-user-view-input'), 'e2e test');
	await hideKeyboard(fixtures);
	await tapWhenVisible(fixtures, 'report-user-view-submit');
	await expectRoomTitle(fixtures, roomTitle);
};

test('blocks, ignores and reports a user', { tags: ['test-4'] }, async fixtures => {
	const { screen, platform } = fixtures;
	const user = await createUser();
	const otherUser = await createUser();
	const room = await createRandomRoom(user);
	await createDM(user, otherUser.username);
	await loginWithDeepLink(fixtures, user);

	await openRoom(fixtures, otherUser.username);
	await navigateToInfoView(fixtures);
	await toggleUserAction(fixtures, 'Block', 'Unblock');
	await goBackThrough(fixtures, INFO_VIA_ACTIONS_TO_ROOMS_LIST);
	await openRoom(fixtures, otherUser.username);
	await expect(screen.getByText('This room is blocked')).toBeVisible({ timeout: LONG_TIMEOUT });

	await navigateToInfoView(fixtures);
	await toggleUserAction(fixtures, 'Unblock', 'Block');
	await goBackThrough(fixtures, INFO_VIA_ACTIONS_TO_ROOMS_LIST);
	await openRoom(fixtures, otherUser.username);
	await expectVisible(fixtures, 'message-composer');
	await backToRoomsList(fixtures);

	await openRoom(fixtures, room.name);
	await sendMessage(otherUser, room._id, 'message-01');
	await sendMessage(otherUser, room._id, 'message-02');
	await expectVisible(fixtures, 'message-content-message-02');
	await openUserInfoFromMessage(fixtures, otherUser.username);
	await toggleUserAction(fixtures, 'Ignore', 'Unignore');
	await goBackThrough(fixtures, INFO_VIA_MESSAGE_TO_ROOMS_LIST);

	await openRoom(fixtures, room.name);
	const ignoredMessage = screen.getByText(/Message ignored\. Tap to display it/).first();
	await expect(ignoredMessage).toBeVisible({ timeout: LONG_TIMEOUT });
	await ignoredMessage.tap();
	await expectVisible(fixtures, `username-header-${otherUser.username}`);
	await expectVisible(fixtures, platform === 'android' ? 'message-content-message-01' : 'message-content-message-02');
	await openUserInfoFromMessage(fixtures, otherUser.username);
	await toggleUserAction(fixtures, 'Unignore', 'Ignore');
	await goBackThrough(fixtures, INFO_VIA_MESSAGE_TO_ROOMS_LIST);
	await openRoom(fixtures, room.name);
	await expect(screen.getByTestId('message-content-message-02').first()).toBeVisible({ timeout: LONG_TIMEOUT });

	await backToRoomsList(fixtures);
	await openRoom(fixtures, otherUser.username);
	await navigateToInfoView(fixtures);
	await reportUser(fixtures, otherUser.username);

	await backToRoomsList(fixtures);
	await openRoom(fixtures, room.name);
	await openUserInfoFromMessage(fixtures, otherUser.username);
	await reportUser(fixtures, room.name);
});
