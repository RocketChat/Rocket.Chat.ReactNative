import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createDM, createRandomRoom, createUser, deleteCreatedUsers, sendMessage } from '~e2e/support/api';
import { goBackUntil, loginWithDeepLink, searchAndNavigateRoom, type Fixtures, LONG_TIMEOUT } from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

const tapNotification = async ({ screen }: Fixtures, message: string) => {
	const notification = screen.getByTestId(`in-app-notification-${message}`).first();
	await expect(notification).toBeVisible({ timeout: LONG_TIMEOUT });
	await notification.tap();
};

test('opens the DM from an in-app notification', { tags: ['test-7'] }, async fixtures => {
	const { screen } = fixtures;
	const sender = await createUser();
	const receiver = await createUser();
	const room = await createRandomRoom(sender);
	const directMessage = await createDM(receiver, sender.username);
	const senderRoomTitle = screen.getByTestId(`room-view-title-${sender.username}`);

	await loginWithDeepLink(fixtures, receiver);

	await sendMessage(sender, directMessage.room.rid, 'Message in DM');
	await tapNotification(fixtures, 'Message in DM');
	await expect(senderRoomTitle).toBeVisible({ timeout: LONG_TIMEOUT });
	await goBackUntil(fixtures, 'rooms-list-view');

	await searchAndNavigateRoom(fixtures, room.name);
	await sendMessage(sender, directMessage.room.rid, 'Another msg');
	await tapNotification(fixtures, 'Another msg');
	await expect(senderRoomTitle).toBeVisible({ timeout: LONG_TIMEOUT });

	await goBackUntil(fixtures, 'rooms-list-view');
});
