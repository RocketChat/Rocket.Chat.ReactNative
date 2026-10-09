import { afterEach, test } from '@e2e-dev/mobile';
import { expect, type Locator } from 'e2e';

import { createDM, createRandomRoom, createUser, deleteCreatedUsers, sendMessage as sendMessageAsUser } from '~e2e/support/api';
import {
	loginWithDeepLink,
	navigateToRoomActions,
	sendMessage,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenVisible,
	backToRoomsList,
	confirmAlert,
	expectHidden,
	expectVisible,
	goBackUntil,
	hideKeyboard,
	openMessageActions,
	openRoomActions,
	succeeds,
	tapUntilVisible
} from '~e2e/support/flows';
import { expandActionSheet, selectUser } from '~e2e/support/room';

afterEach(deleteCreatedUsers);

const ROOM_ACTIONS = ['info', 'members', 'files', 'mentioned', 'starred', 'share', 'pinned', 'notifications', 'leave-channel'];
const NOTIFICATION_PREFERENCES = ['receive-notification', 'mark-as-unread', 'alert', 'push-notification', 'sound', 'email-alert'];

const expectText = ({ screen }: Fixtures, text: string | RegExp) =>
	expect(screen.getByText(text).first()).toBeVisible({ timeout: LONG_TIMEOUT });

const backToRoomActions = (fixtures: Fixtures) => goBackUntil(fixtures, 'room-actions-view');
const backToRoom = (fixtures: Fixtures) => goBackUntil(fixtures, 'room-view');

const openRoomAction = async (fixtures: Fixtures, action: string, viewTestId: string) => {
	const { screen } = fixtures;
	const target = screen.getByTestId(`room-actions-${action}`);
	await screen.scrollUntilVisible(target, { timeout: LONG_TIMEOUT });
	await tapUntilVisible(fixtures, target, viewTestId);
};

const tapMessageActionText = async (fixtures: Fixtures, message: string, actionText: string) => {
	const { screen } = fixtures;
	await openMessageActions(fixtures, message);
	await expandActionSheet(fixtures);
	await screen.scrollUntilVisible(screen.getByText(actionText), { timeout: LONG_TIMEOUT });
	await screen.getByText(actionText).tap();
};

const expectStarredMessage = async (fixtures: Fixtures, message: string, starred: boolean) => {
	await openRoomActions(fixtures);
	await openRoomAction(fixtures, 'starred', 'starred-messages-view');
	if (starred) {
		await expectVisible(fixtures, `message-content-${message}`);
	} else {
		await expectText(fixtures, 'No starred messages');
		await expectHidden(fixtures, `message-content-${message}`);
	}
	await backToRoomActions(fixtures);
	await backToRoom(fixtures);
};

const expectToastDismissed = async ({ screen }: Fixtures, text: RegExp) => {
	const toast = screen.getByText(text);
	await expect(toast).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(toast).toBeHidden({ timeout: LONG_TIMEOUT });
};

const starAndUnstarMessage = async (fixtures: Fixtures) => {
	const message = 'messageToStar';
	await sendMessage(fixtures, message);
	await tapMessageActionText(fixtures, message, 'Star');
	await expectToastDismissed(fixtures, /Message starred/i);
	await expectStarredMessage(fixtures, message, true);
	await tapMessageActionText(fixtures, message, 'Unstar');
	await expectToastDismissed(fixtures, /Message unstarred/i);
	await expectStarredMessage(fixtures, message, false);
};

const pinAndUnpinMessage = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	const message = 'messageToPin';
	await sendMessage(fixtures, message);
	await tapMessageActionText(fixtures, message, 'Pin');
	await expectText(fixtures, /Pinned a message:/);
	await openRoomActions(fixtures);
	await openRoomAction(fixtures, 'pinned', `message-content-${message}`);
	await screen.getByTestId(`message-content-${message}`).longPress();
	await expectText(fixtures, 'Unpin');
	await screen.getByText('Unpin').tap();
	await expectHidden(fixtures, `message-content-${message}`);
	await backToRoomActions(fixtures);
};

const expectNotificationPreferences = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	await openRoomAction(fixtures, 'notifications', 'notification-preference-view');
	for (const preference of NOTIFICATION_PREFERENCES) {
		const target = screen.getByTestId(`notification-preference-view-${preference}`);
		await screen.scrollUntilVisible(target, { timeout: LONG_TIMEOUT });
	}
	await backToRoomActions(fixtures);
};

const tryLeavingAsLastOwner = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	await screen.scrollUntilVisible(screen.getByTestId('room-actions-leave-channel'), { timeout: LONG_TIMEOUT });
	await screen.getByTestId('room-actions-leave-channel').tap();
	await confirmAlert(fixtures, /Are you sure you want to leave the room/, /YES, LEAVE IT!/i);
	await confirmAlert(fixtures, /You are the last owner. Please set new owner before leaving the room/, /^OK$/i);
	await expectVisible(fixtures, 'room-actions-view');
};

const addUsersToRoom = async (fixtures: Fixtures, user: { username: string; password: string }, otherUsername: string) => {
	await openRoomAction(fixtures, 'members', 'room-actions-add-user');
	await tapWhenVisible(fixtures, 'room-actions-add-user');
	await createDM(user, 'rocket.cat');
	await tapWhenVisible(fixtures, 'select-users-view-item-rocket.cat');
	await expectVisible(fixtures, 'selected-user-rocket.cat');
	await selectUser(fixtures, otherUsername);
	await tapWhenVisible(fixtures, 'selected-users-view-submit');
	await expectVisible(fixtures, 'room-members-view');
	await goBackUntil(fixtures, 'room-actions-view');
	await expectText(fixtures, /3 members/);
};

const memberTestId = (username: string) => `room-members-view-item-${username}`;

const openMembers = (fixtures: Fixtures) => openRoomAction(fixtures, 'members', 'room-members-view');

const showAllMembers = async (fixtures: Fixtures, otherUsername: string) => {
	await openMembers(fixtures);
	await tapWhenVisible(fixtures, 'room-members-view-filter');
	await tapWhenVisible(fixtures, 'room-members-view-toggle-status-all');
	await expectHidden(fixtures, 'room-members-view-toggle-status-all');
	await expectVisible(fixtures, memberTestId(otherUsername));
	await backToRoomActions(fixtures);
};

const CLEAR_BUTTON_INSET = 34;

const clearMemberSearch = async (fixtures: Fixtures) => {
	if (fixtures.platform === 'android') {
		await tapWhenVisible(fixtures, 'clear-text-input');
		return;
	}
	const searchbox = fixtures.screen.getByTestId('searchbox');
	const box = await searchbox.boundingBox();
	if (!box) {
		throw new Error('searchbox has no bounding box');
	}
	await searchbox.tap({ position: { x: box.width - CLEAR_BUTTON_INSET, y: box.height / 2 } });
};

const filterMembers = async (fixtures: Fixtures, otherUsername: string) => {
	await openMembers(fixtures);
	await expectVisible(fixtures, memberTestId(otherUsername));
	await expectVisible(fixtures, 'room-members-view-search');
	await fixtures.screen.getByTestId('room-members-view-search').pressSequentially('rocket');
	await hideKeyboard(fixtures, fixtures.screen.getByTestId('room-members-view'));
	await expectVisible(fixtures, memberTestId('rocket.cat'));
	await expectHidden(fixtures, memberTestId(otherUsername));
	await clearMemberSearch(fixtures);
	await expectVisible(fixtures, memberTestId('rocket.cat'));
	await expectVisible(fixtures, memberTestId(otherUsername));
};

const openMemberActions = (fixtures: Fixtures, username: string) => tapWhenVisible(fixtures, memberTestId(username));

const removeMember = async (fixtures: Fixtures, username: string) => {
	await openMemberActions(fixtures, username);
	await tapWhenVisible(fixtures, 'action-sheet-remove-from-room');
	await confirmAlert(fixtures, /The user will be removed from/, /YES, REMOVE USER!/i);
	await expectHidden(fixtures, memberTestId(username));
};

const cancelActionSheet = async (fixtures: Fixtures) => {
	await tapWhenVisible(fixtures, 'action-sheet-handle');
	await expectHidden(fixtures, 'action-sheet');
};

const MEMBER_STATE_ATTEMPTS = 5;
const MEMBER_STATE_TIMEOUT = 5_000;

const openMemberActionsShowing = async (fixtures: Fixtures, username: string, expected: Locator) => {
	for (let attempt = 1; attempt < MEMBER_STATE_ATTEMPTS; attempt += 1) {
		await openMemberActions(fixtures, username);
		if (await succeeds(expect(expected).toBeVisible({ timeout: MEMBER_STATE_TIMEOUT }))) {
			return;
		}
		await cancelActionSheet(fixtures);
	}
	await openMemberActions(fixtures, username);
	await expect(expected).toBeVisible({ timeout: LONG_TIMEOUT });
};

const toggleRole = async (fixtures: Fixtures, username: string, role: 'owner' | 'moderator') => {
	const roleState = (state: string) => fixtures.screen.getByTestId(`action-sheet-set-${role}-${state}`);
	for (const state of ['unchecked', 'checked']) {
		await openMemberActionsShowing(fixtures, username, roleState(state));
		await tapWhenVisible(fixtures, `action-sheet-set-${role}`);
	}
	await openMemberActionsShowing(fixtures, username, roleState('unchecked'));
	await cancelActionSheet(fixtures);
};

const toggleMute = async (fixtures: Fixtures, username: string) => {
	for (const label of ['Disable writing in room', 'Enable writing in room']) {
		await openMemberActionsShowing(fixtures, username, fixtures.screen.getByText(label).first());
		await tapWhenVisible(fixtures, 'action-sheet-mute-user');
		await confirmAlert(fixtures, /Are you sure\?/, new RegExp(`^${label}$`, 'i'));
	}
	await openMemberActionsShowing(fixtures, username, fixtures.screen.getByText('Disable writing in room').first());
	await cancelActionSheet(fixtures);
};

const ignoreMember = async (fixtures: Fixtures, username: string) => {
	const { screen } = fixtures;
	await openMemberActions(fixtures, username);
	await tapWhenVisible(fixtures, 'action-sheet-ignore-user');
	await expectText(fixtures, 'User has been ignored');
	await backToRoomActions(fixtures);
	await backToRoom(fixtures);
	const ignored = screen.getByText(/Message ignored. Tap to display it./).first();
	await expect(ignored).toBeVisible({ timeout: LONG_TIMEOUT });
	await ignored.tap();
	await expectText(fixtures, /ignoredmessagecontent/);
};

const openDirectMessageWithMember = async (fixtures: Fixtures, username: string) => {
	await openRoomActions(fixtures);
	await openMembers(fixtures);
	await openMemberActions(fixtures, username);
	await expectText(fixtures, 'Direct message');
	await fixtures.screen.getByText('Direct message').tap();
	await expectVisible(fixtures, `room-view-title-${username}`);
	await backToRoomsList(fixtures);
};

test('manages a room through its actions', { tags: ['test-11'], timeout: 900_000 }, async fixtures => {
	const user = await createUser();
	const otherUser = await createUser();
	const room = await createRandomRoom(user);

	await loginWithDeepLink(fixtures, user);
	await navigateToRoomActions(fixtures, room.name);
	for (const action of ROOM_ACTIONS) {
		await expectVisible(fixtures, `room-actions-${action}`);
	}
	await expectText(fixtures, /1 members/);

	await openRoomAction(fixtures, 'mentioned', 'mentioned-messages-view');
	await backToRoomActions(fixtures);
	await backToRoom(fixtures);

	await starAndUnstarMessage(fixtures);
	await pinAndUnpinMessage(fixtures);
	await expectNotificationPreferences(fixtures);
	await tryLeavingAsLastOwner(fixtures);

	await addUsersToRoom(fixtures, user, otherUser.username);
	await showAllMembers(fixtures, otherUser.username);
	await filterMembers(fixtures, otherUser.username);
	await removeMember(fixtures, 'rocket.cat');
	await toggleRole(fixtures, otherUser.username, 'owner');
	await toggleRole(fixtures, otherUser.username, 'moderator');
	await toggleMute(fixtures, otherUser.username);

	await sendMessageAsUser(otherUser, room.name, 'ignoredmessagecontent');
	await ignoreMember(fixtures, otherUser.username);
	await openDirectMessageWithMember(fixtures, otherUser.username);
});
