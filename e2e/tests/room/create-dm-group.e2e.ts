import { afterEach, test } from '@e2e-dev/mobile';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { loginWithDeepLink, tapWhenVisible, expectVisible } from '~e2e/support/flows';
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
	await tapWhenVisible(fixtures, 'selected-users-view-submit');

	await expectVisible(fixtures, `room-view-title-rocket.cat, ${otherUser.username}`);
});
