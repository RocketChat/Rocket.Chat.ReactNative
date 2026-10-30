import { afterEach, test } from '~e2e/support/fixtures';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { loginWithDeepLink, tapWhenVisible, expectVisible } from '~e2e/support/flows';
import { expectRoomTitle, submitSelectedUsers } from '~e2e/support/header';
import { openNewMessage, selectUser } from '~e2e/support/room';

afterEach(deleteCreatedUsers);

test('creates a group DM', { tags: ['test-2'] }, async fixtures => {
	const user = await createUser();
	const otherUser = await createUser();
	await loginWithDeepLink(fixtures, user);

	await openNewMessage(fixtures);
	await expectVisible(fixtures, 'new-message-view-search');
	await tapWhenVisible(fixtures, 'new-message-view-create-direct-message');

	await selectUser(fixtures, 'rocket.cat');
	await selectUser(fixtures, otherUser.username);
	if (fixtures.platform === 'android') {
		await fixtures.device.dismissKeyboard();
	}
	await submitSelectedUsers(fixtures);

	await expectRoomTitle(fixtures, `rocket.cat, ${otherUser.username}`);
});
