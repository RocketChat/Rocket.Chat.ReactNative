import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	backToRoomsList,
	loginWithDeepLink,
	navigateToRoom,
	sendMessage,
	LONG_TIMEOUT,
	tapWhenVisible,
	openMessageActions,
	fillWhenUncovered,
	tapSend,
	withFixtures
} from '~e2e/support/flows';
import { openThreadFromButton, replyInThread, sendThreadReply, THREAD_INPUT } from '~e2e/support/threads';
import { clearLocalCache, openSettings } from '~e2e/support/settings';

afterEach(deleteCreatedUsers);

test(
	'edits a thread reply after app data is cleared',
	{ tags: ['test-4'], timeout: 600_000 },
	withFixtures(async fixtures => {
		const { screen } = fixtures;
		const user = await createUser();
		const room = await createRandomRoom(user);

		await loginWithDeepLink(fixtures, user);
		await navigateToRoom(fixtures, room.name);
		await sendMessage(fixtures, 'thread');
		await replyInThread(fixtures, 'thread');
		await sendThreadReply(fixtures, 'reply-to-edit');

		await backToRoomsList(fixtures);
		await openSettings(fixtures);
		await clearLocalCache(fixtures);

		await navigateToRoom(fixtures, room.name);
		await openThreadFromButton(fixtures, 'thread');

		await openMessageActions(fixtures, 'reply-to-edit');
		await tapWhenVisible(fixtures, 'message-actions-edit');
		await expect(screen.getByTestId(THREAD_INPUT)).toHaveValue('reply-to-edit', { timeout: LONG_TIMEOUT });

		await fillWhenUncovered(screen.getByTestId(THREAD_INPUT), 'reply-edited');
		await tapSend(fixtures);
		await expect(screen.getByTestId('message-content-reply-edited')).toBeVisible({ timeout: LONG_TIMEOUT });
	})
);
