import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	goBack,
	loginWithDeepLink,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenVisible,
	expectVisible,
	fillWhenUncovered,
	clearSettled
} from '~e2e/support/flows';
import { random } from '~e2e/support/random';
import { openNewMessage, selectUser } from '~e2e/support/room';

afterEach(deleteCreatedUsers);

const openSelectUsers = async (fixtures: Fixtures) => {
	await openNewMessage(fixtures);
	await tapWhenVisible(fixtures, 'new-message-view-create-channel');
	await expectVisible(fixtures, 'select-users-view');
};

const dismissChannelKeyboard = async ({ screen }: Fixtures) => {
	const doneKey = screen.getByTestId('Done', { visible: true });
	if (await doneKey.isVisible()) {
		await doneKey.tap();
	}
};

const fillChannelName = async (fixtures: Fixtures, name: string) => {
	const { screen } = fixtures;
	const nameInput = screen.getByTestId('create-channel-name');
	await dismissChannelKeyboard(fixtures);
	await screen.scrollUntilVisible(nameInput, { direction: 'up' });
	await clearSettled(nameInput);
	await nameInput.pressSequentially(name);
	await dismissChannelKeyboard(fixtures);
};

const submitChannelName = async (fixtures: Fixtures, name: string) => {
	await fillChannelName(fixtures, name);
	await tapWhenVisible(fixtures, 'create-channel-submit');
};

const expectRoomCreated = async (fixtures: Fixtures, name: string) => {
	await expectVisible(fixtures, 'room-view');
	await expectVisible(fixtures, `room-view-title-${name}`);
	await goBack(fixtures);
	await expectVisible(fixtures, 'rooms-list-view');
	await expectVisible(fixtures, `rooms-list-view-item-${name}`);
};

test('creates rooms', { tags: ['test-10'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	await loginWithDeepLink(fixtures, user);

	await openNewMessage(fixtures);
	await expectVisible(fixtures, 'new-message-view-search');
	await tapWhenVisible(fixtures, 'new-message-view-close');
	await expectVisible(fixtures, 'rooms-list-view');

	await openNewMessage(fixtures);
	await tapWhenVisible(fixtures, 'new-message-view-search');
	await fillWhenUncovered(screen.getByTestId('new-message-view-search'), 'rocket.cat');
	await tapWhenVisible(fixtures, 'new-message-view-item-rocket.cat');
	await expectVisible(fixtures, 'room-view');
	await expectVisible(fixtures, 'room-view-title-rocket.cat');
	await goBack(fixtures);
	await expectVisible(fixtures, 'rooms-list-view');

	await openSelectUsers(fixtures);
	await selectUser(fixtures, 'rocket.cat');
	await tapWhenVisible(fixtures, 'selected-user-rocket.cat');
	await expect(screen.getByTestId('selected-user-rocket.cat')).toBeHidden({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'select-users-view-item-rocket.cat');
	await expectVisible(fixtures, 'selected-user-rocket.cat');
	await tapWhenVisible(fixtures, 'selected-users-view-submit');
	await expectVisible(fixtures, 'create-channel-view');
	for (const field of ['create-channel-name', 'create-channel-type', 'create-channel-readonly', 'create-channel-broadcast']) {
		await expectVisible(fixtures, field);
	}

	await submitChannelName(fixtures, 'general');
	await expect(screen.getByText(/A channel with name general exists/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByRole('button', { name: /^OK$/i }).tap();

	const publicRoomName = `public${random()}`;
	await fillChannelName(fixtures, publicRoomName);
	await tapWhenVisible(fixtures, 'create-channel-type');
	await tapWhenVisible(fixtures, 'create-channel-submit');
	await expectRoomCreated(fixtures, publicRoomName);

	const privateRoomName = `private${random()}`;
	await openSelectUsers(fixtures);
	await tapWhenVisible(fixtures, 'select-users-view-item-rocket.cat');
	await expectVisible(fixtures, 'selected-user-rocket.cat');
	await tapWhenVisible(fixtures, 'selected-users-view-submit');
	await expectVisible(fixtures, 'create-channel-view');
	await submitChannelName(fixtures, privateRoomName);
	await expectRoomCreated(fixtures, privateRoomName);

	const emptyRoomName = `empty${random()}`;
	await openSelectUsers(fixtures);
	await tapWhenVisible(fixtures, 'selected-users-view-submit');
	await expectVisible(fixtures, 'create-channel-view');
	await submitChannelName(fixtures, emptyRoomName);
	await expectRoomCreated(fixtures, emptyRoomName);
});
