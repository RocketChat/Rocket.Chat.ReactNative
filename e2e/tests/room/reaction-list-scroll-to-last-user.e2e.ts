import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers, reactAsNewUsers, sendMessage } from '~e2e/support/api';
import { loginWithDeepLink, navigateToRoom, LONG_TIMEOUT, tapWhenVisible, expectVisible } from '~e2e/support/flows';
import { random } from '~e2e/support/random';

afterEach(deleteCreatedUsers);

const REACTOR_COUNT = 15;

test('scrolls the reaction list to the last user', { tags: ['test-6'], timeout: 300_000 }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const room = await createRandomRoom(user);
	const messageText = `reaction-list-message-${random()}`;
	const { message } = await sendMessage(user, room.name, messageText);
	await loginWithDeepLink(fixtures, user);
	await navigateToRoom(fixtures, room.name);
	await expect(screen.getByText(messageText, { exact: false }).first()).toBeVisible({ timeout: LONG_TIMEOUT });

	const reactors = await reactAsNewUsers(REACTOR_COUNT, message._id, ':thumbsup:');
	const lastReactor = reactors[REACTOR_COUNT - 1];

	await expectVisible(fixtures, 'message-reaction-:thumbsup:');
	await screen.getByTestId('message-reaction-:thumbsup:').longPress();
	await expectVisible(fixtures, 'reactionsList');
	await tapWhenVisible(fixtures, 'reactions-tab-:thumbsup:');
	await screen
		.getByTestId('usersList-:thumbsup:')
		.scrollUntilVisible(screen.getByText(lastReactor.username), { timeout: LONG_TIMEOUT });
});
