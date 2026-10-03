import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { data } from '~e2e/support/data';
import { loginWithDeepLink, searchAndNavigateRoom, sendMessage, LONG_TIMEOUT, tapWhenVisible } from '~e2e/support/flows';
import { random } from '~e2e/support/random';

afterEach(deleteCreatedUsers);

test('joins a protected room with a join code', { tags: ['test-7'] }, async fixtures => {
	const { screen } = fixtures;
	const { name, joinCode } = data.channels.detoxpublicprotected;
	const joinCodeSheet = screen.getByTestId('join-code');
	const user = await createUser();

	await loginWithDeepLink(fixtures, user);
	await searchAndNavigateRoom(fixtures, name);

	await tapWhenVisible(fixtures, 'room-view-join-button');
	await expect(joinCodeSheet).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('join-code-cancel').tap();
	await expect(joinCodeSheet).toBeHidden({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId('message-composer')).toBeHidden();
	await expect(screen.getByTestId('room-view-join-button')).toBeVisible();

	await screen.getByTestId('room-view-join-button').tap();
	await expect(joinCodeSheet).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('join-code-input').fill(joinCode);
	await screen.getByTestId('join-code-submit').tap();
	await expect(joinCodeSheet).toBeHidden({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId('message-composer')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId('room-view-join')).toBeHidden({ timeout: LONG_TIMEOUT });
	await sendMessage(fixtures, `${random(10)}message`);
});
