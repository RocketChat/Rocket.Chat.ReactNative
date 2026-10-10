import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { type Credentials, createRandomRoom, createUser, deleteCreatedUsers, get } from '~e2e/support/api';
import { expectVisible, loginWithDeepLink, LONG_TIMEOUT, searchAndNavigateRoom, tapWhenVisible } from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

interface HistoryMessage {
	u?: { username?: string };
	files?: { type?: string }[];
	attachments?: { image_url?: string }[];
}

const isImageMessage = (message: HistoryMessage) =>
	Boolean(
		message.files?.some(file => file.type?.startsWith('image/')) || message.attachments?.some(attachment => attachment.image_url)
	);

const hasImageMessageFrom = async (credentials: Credentials, roomId: string) => {
	const { messages } = await get(`channels.history?roomId=${roomId}&count=20`, credentials);
	return (messages as HistoryMessage[]).some(message => message.u?.username === credentials.username && isImageMessage(message));
};

test('sends an image picked from the library', { tags: ['test-3'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const room = await createRandomRoom(user);

	await loginWithDeepLink(fixtures, user);
	await searchAndNavigateRoom(fixtures, room.name);

	await tapWhenVisible(fixtures, 'message-composer-actions');
	await expectVisible(fixtures, 'action-sheet');
	await expect(screen.getByText('Choose from library')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByText('Choose from library').tap();
	await expectVisible(fixtures, 'message-composer-attachment-0');
	await tapWhenVisible(fixtures, 'message-composer-send');

	await expect.poll(() => hasImageMessageFrom(user, room._id), { timeout: LONG_TIMEOUT }).toBe(true);
});
