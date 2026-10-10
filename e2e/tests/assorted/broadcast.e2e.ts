import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	goBackUntil,
	hideKeyboard,
	loginWithDeepLink,
	searchAndNavigateRoom,
	sendMessage,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenVisible,
	fillWhenUncovered
} from '~e2e/support/flows';
import { random } from '~e2e/support/random';
import { openNewMessage } from '~e2e/support/room';

afterEach(deleteCreatedUsers);

const enableBroadcast = async ({ screen, platform }: Fixtures) => {
	const broadcastSwitch = screen.getByTestId('create-channel-broadcast');
	if (platform === 'ios') {
		await broadcastSwitch.check();
		return;
	}
	await broadcastSwitch.tap();
};

const createBroadcastChannel = async (fixtures: Fixtures, room: string, member: string) => {
	const { screen } = fixtures;
	await openNewMessage(fixtures);
	await tapWhenVisible(fixtures, 'new-message-view-create-channel');
	await tapWhenVisible(fixtures, 'select-users-view-search');
	await fillWhenUncovered(screen.getByTestId('select-users-view-search'), member);
	await tapWhenVisible(fixtures, `select-users-view-item-${member}`);
	await expect(screen.getByTestId(`selected-user-${member}`)).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'selected-users-view-submit');
	await expect(screen.getByTestId('create-channel-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await fillWhenUncovered(screen.getByTestId('create-channel-name'), room);
	await hideKeyboard(fixtures);
	await enableBroadcast(fixtures);
	await tapWhenVisible(fixtures, 'create-channel-submit');
	await expect(screen.getByTestId(`room-view-title-${room}`)).toBeVisible({ timeout: LONG_TIMEOUT });
};

const expectBroadcastInRoomInfo = async (fixtures: Fixtures) => {
	await tapWhenVisible(fixtures, 'room-header');
	await tapWhenVisible(fixtures, 'room-actions-info');
	await expect(fixtures.screen.getByTestId('room-info-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(fixtures.screen.getByTestId('room-info-view-broadcast').first()).toBeVisible({ timeout: LONG_TIMEOUT });
};

const returnToRoom = async (fixtures: Fixtures, room: string) => {
	await goBackUntil(fixtures, 'room-actions-view');
	await goBackUntil(fixtures, 'room-view');
	await expect(fixtures.screen.getByTestId(`room-view-title-${room}`)).toBeVisible({ timeout: LONG_TIMEOUT });
};

test('creates a broadcast room and replies to its message', { tags: ['test-9'] }, async fixtures => {
	const { screen } = fixtures;
	const room = `broadcast${random()}`;
	const owner = await createUser();
	const member = await createUser();

	await loginWithDeepLink(fixtures, owner);
	await createBroadcastChannel(fixtures, room, member.username);
	await expectBroadcastInRoomInfo(fixtures);
	await returnToRoom(fixtures, room);
	await sendMessage(fixtures, 'message');

	await loginWithDeepLink(fixtures, member);
	await searchAndNavigateRoom(fixtures, room);
	await expect(screen.getByTestId('message-composer')).toBeHidden();
	await expect(screen.getByLabel('This room is read only')).toBeVisible();
	await expect(screen.getByTestId('message-content-message')).toBeVisible();

	await screen.getByTestId('message-broadcast-reply').tap();
	await expect(screen.getByTestId(`room-view-title-${owner.username}`)).toBeVisible({ timeout: LONG_TIMEOUT });
	await fillWhenUncovered(screen.getByTestId('message-composer-input'), 'broadcastreply');
	await screen.getByTestId('message-composer-send').tap();
	const reply = screen.getByText(/broadcastreply/).first();
	await expect(reply).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId(`reply-${owner.username}-message`)).toBeVisible({ timeout: LONG_TIMEOUT });
	await reply.longPress();
	await expect(screen.getByText('Jump to message')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByText('Jump to message').tap();
	await expect(screen.getByTestId(`room-view-title-${room}`)).toBeVisible({ timeout: LONG_TIMEOUT });
});
