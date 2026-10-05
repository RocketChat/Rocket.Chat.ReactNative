import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	createE2EERoom,
	changeE2EEPassword,
	editMessage,
	expectLastMessageUnread,
	expectMessages,
	navigateToE2EESecurity,
	openEncryptedRoom,
	openRoomFromList,
	quoteMessage,
	resetE2EEKey,
	resetRoomKey,
	setupE2EEUser
} from '~e2e/support/e2ee';
import { backToRoomsList, loginWithDeepLink, sendMessage, LONG_TIMEOUT } from '~e2e/support/flows';
import { random } from '~e2e/support/random';

afterEach(deleteCreatedUsers);

test('encrypts, decrypts, quotes, resets keys and edits messages', { tags: ['test-3'], timeout: 1_200_000 }, async fixtures => {
	const { screen } = fixtures;
	const room = `encrypted${random()}`;
	const userA = await createUser();
	const userB = await createUser();

	await setupE2EEUser(fixtures, userB);
	await setupE2EEUser(fixtures, userA);

	await createE2EERoom(fixtures, room, userB.username);
	await expect(screen.getByTestId('message-composer-input')).toBeVisible({ timeout: LONG_TIMEOUT });
	await sendMessage(fixtures, 'm0');

	await sendMessage(fixtures, 'm1');
	await quoteMessage(fixtures, 'm1', 'm2');
	await expect(screen.getByTestId(`reply-${userA.username}-m1`)).toBeVisible({ timeout: LONG_TIMEOUT });

	await loginWithDeepLink(fixtures, userB);
	await openRoomFromList(fixtures, room);
	await expect(screen.getByTestId('room-view-encrypted-room')).toBeVisible({ timeout: LONG_TIMEOUT });

	await loginWithDeepLink(fixtures, userA);
	await openEncryptedRoom(fixtures, room);
	await expectLastMessageUnread(fixtures);

	await loginWithDeepLink(fixtures, userB);
	await openEncryptedRoom(fixtures, room);
	await expectMessages(fixtures, ['m0', 'm1', 'm2']);
	await sendMessage(fixtures, 'm3');

	await loginWithDeepLink(fixtures, userA);
	await openEncryptedRoom(fixtures, room);
	await expectMessages(fixtures, ['m0', 'm1', 'm2', 'm3']);

	await loginWithDeepLink(fixtures, userA);
	await navigateToE2EESecurity(fixtures);
	await resetE2EEKey(fixtures);
	await loginWithDeepLink(fixtures, userA);
	await navigateToE2EESecurity(fixtures);
	await changeE2EEPassword(fixtures);
	await fixtures.app.restart();
	await openRoomFromList(fixtures, room);
	await resetRoomKey(fixtures);
	await backToRoomsList(fixtures);
	await openRoomFromList(fixtures, room);
	await sendMessage(fixtures, 'm4');

	await loginWithDeepLink(fixtures, userB);
	await openEncryptedRoom(fixtures, room);
	await sendMessage(fixtures, 'm5');
	await expectMessages(fixtures, ['m0', 'm1', 'm2', 'm3', 'm4', 'm5']);

	await sendMessage(fixtures, 'm99');
	await editMessage(fixtures, 'm99', 'm6');
	await expectMessages(fixtures, ['m0', 'm1', 'm2', 'm3', 'm4', 'm6']);
});
