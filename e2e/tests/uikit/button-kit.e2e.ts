import { afterEach, test } from '@e2e-dev/mobile';

import { createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import { hideKeyboard, loginWithDeepLink, navigateToRoom } from '~e2e/support/flows';
import { expectBotReply, runSlashCommand, tapBotMessageButton } from '~e2e/support/uikit';

afterEach(deleteCreatedUsers);

test('replies to a UIKit button tap', { tags: ['test-14'] }, async fixtures => {
	const user = await createUser();
	const room = await createRandomRoom(user);

	await loginWithDeepLink(fixtures, user);
	await navigateToRoom(fixtures, room.name);
	await runSlashCommand(fixtures, 'uikit-test');
	await hideKeyboard(fixtures);
	await tapBotMessageButton(fixtures, { botUsername: 'uikit-mobile-test.bot', buttonName: 'Tap Me' });
	await expectBotReply(fixtures, 'uikit-mobile-test.bot', /Button tap received! This reply is private to you/);
});
