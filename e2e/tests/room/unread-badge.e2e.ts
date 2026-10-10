import { afterEach, test } from '@e2e-dev/mobile';

import { createUser, deleteCreatedUsers, sendMessage } from '~e2e/support/api';
import { loginWithDeepLink } from '~e2e/support/flows';
import { expectBadgeClearsAfterOpeningRoom } from '~e2e/support/room';

const NORMAL_MESSAGE = 'message-mark-as-unread';

afterEach(deleteCreatedUsers);

test('shows unread and mention badges', { tags: ['test-8'], platforms: ['android'], timeout: 600_000 }, async fixtures => {
	const user = await createUser();
	const otherUser = await createUser();
	const userHandle = `@${user.username}`;
	const sendFromOtherUser = (text: string) => sendMessage(otherUser, userHandle, text);
	const mentionUser = () => sendFromOtherUser(userHandle);

	await loginWithDeepLink(fixtures, user);

	await sendFromOtherUser(NORMAL_MESSAGE);
	await expectBadgeClearsAfterOpeningRoom(fixtures, otherUser.username, 'unread-badge-1');

	await mentionUser();
	await expectBadgeClearsAfterOpeningRoom(fixtures, otherUser.username, 'mention-badge-1');

	await sendFromOtherUser(NORMAL_MESSAGE);
	await mentionUser();
	await expectBadgeClearsAfterOpeningRoom(fixtures, otherUser.username, 'mention-badge-2');

	await mentionUser();
	await sendFromOtherUser(NORMAL_MESSAGE);
	await expectBadgeClearsAfterOpeningRoom(fixtures, otherUser.username, 'mention-badge-2');
});
