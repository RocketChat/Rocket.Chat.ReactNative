import { afterEach, test } from '~e2e/support/fixtures';
import { expect } from 'e2e';

import { openRoom } from '~e2e/support/appduct';
import { createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	goBack,
	hideKeyboard,
	loginWithDeepLink,
	sendMessage,
	type Fixtures,
	LONG_TIMEOUT,
	tapUntilHidden,
	tapUntilVisible,
	tapWhenVisible,
	expectVisible,
	fillWhenUncovered,
	headerItem
} from '~e2e/support/flows';
import { expectRoomTitle, submitSelectedUsers } from '~e2e/support/header';
import { random } from '~e2e/support/random';
import { openNewMessage, selectUser } from '~e2e/support/room';

afterEach(deleteCreatedUsers);

const roomActions = ['info', 'members', 'files', 'mentioned', 'starred', 'share'].map(action => `room-actions-${action}`);
const scrolledRoomActions = ['pinned', 'notifications', 'leave-channel'].map(action => `room-actions-${action}`);

const submitDiscussion = async (fixtures: Fixtures, name: string) => {
	await fillWhenUncovered(fixtures.screen.getByTestId('multi-select-discussion-name'), name);
	if (fixtures.platform === 'ios') {
		await fixtures.screen.getByTestId('multi-select-discussion-name').press('Enter');
	}
	await tapWhenVisible(fixtures, 'create-discussion-submit');
	await expectVisible(fixtures, 'room-view');
	await expectRoomTitle(fixtures, name);
};

const createDiscussionFromNewMessage = async (fixtures: Fixtures, roomName: string, name: string) => {
	await openNewMessage(fixtures);
	await tapWhenVisible(fixtures, 'new-message-view-create-discussion');
	await expectVisible(fixtures, 'select-users-view');
	await selectUser(fixtures, 'rocket.cat');
	await expectVisible(fixtures, 'selected-user-rocket.cat');
	await submitSelectedUsers(fixtures);
	await expectVisible(fixtures, 'create-discussion-view');
	await tapWhenVisible(fixtures, 'create-discussion-select-channel');
	await expectVisible(fixtures, 'action-sheet');
	await tapWhenVisible(fixtures, `multi-select-item-${roomName}`);
	await submitDiscussion(fixtures, name);
};

const createDiscussionFromComposer = async (fixtures: Fixtures, roomName: string, name: string) => {
	const { screen } = fixtures;
	await tapWhenVisible(fixtures, 'message-composer-actions');
	await expectVisible(fixtures, 'action-sheet');
	await screen.getByText('Create discussion').tap();
	await expectVisible(fixtures, 'create-discussion-view');
	await expect(screen.getByText(roomName, { exact: false }).first()).toBeVisible({ timeout: LONG_TIMEOUT });
	await submitDiscussion(fixtures, name);
};

const createDiscussionFromMessage = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	await expectVisible(fixtures, 'message-composer');
	await sendMessage(fixtures, 'message');
	await screen.getByTestId('message-content-message').longPress();
	await expectVisible(fixtures, 'action-sheet');
	await screen.getByText('Start a discussion').tap();
	await expectVisible(fixtures, 'create-discussion-view');
	await tapUntilHidden(fixtures, 'create-discussion-submit', 'create-discussion-view');
	await expectVisible(fixtures, 'room-view');
	await expectRoomTitle(fixtures, 'message');
};

const checkRoomActions = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	await expectVisible(fixtures, 'room-header');
	await tapUntilVisible(fixtures, screen.getByTestId('room-header').first(), 'room-actions-view');
	for (const testId of roomActions) {
		await expect(screen.getByTestId(testId)).toBeVisible();
	}
	for (const testId of scrolledRoomActions) {
		await screen.scrollUntilVisible(screen.getByTestId(testId));
	}
	await screen.scrollUntilVisible(screen.getByTestId('room-actions-info'), { direction: 'up' });
	await tapUntilVisible(fixtures, screen.getByTestId('room-actions-info'), 'room-info-view');
	await expect(headerItem(fixtures, 'room-info-view-edit-button', 'Room info edit')).toBeVisible();
	await goBack(fixtures);
	await expectVisible(fixtures, 'room-actions-view');
	await goBack(fixtures);
	await expectVisible(fixtures, 'room-view-messages');
	await goBack(fixtures);
	await expectVisible(fixtures, 'rooms-list-view');
};

test('creates and navigates discussions', { tags: ['test-5'] }, async fixtures => {
	const user = await createUser();
	const room = await createRandomRoom(user);
	const discussionFromNewMessage = `${random()} Discussion NewMessageView`;
	const discussionFromComposer = `${random()} Discussion MessageComposer actions`;
	await loginWithDeepLink(fixtures, user);

	await createDiscussionFromNewMessage(fixtures, room.name, discussionFromNewMessage);
	await hideKeyboard(fixtures);
	await goBack(fixtures);
	await expectVisible(fixtures, `rooms-list-view-item-${discussionFromNewMessage}`);

	await openRoom(fixtures, room.name);
	await createDiscussionFromComposer(fixtures, room.name, discussionFromComposer);
	await createDiscussionFromMessage(fixtures);
	await checkRoomActions(fixtures);

	await openRoom(fixtures, room.name);
	await tapWhenVisible(fixtures, 'room-header');
	await tapWhenVisible(fixtures, 'room-actions-discussions');
	await expectVisible(fixtures, 'discussions-view');
	await tapWhenVisible(fixtures, `discussions-view-${discussionFromNewMessage}`);
	await expectRoomTitle(fixtures, discussionFromNewMessage);
});
