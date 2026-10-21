import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	loginWithDeepLink,
	navigateToRoom,
	sendMessage,
	LONG_TIMEOUT,
	tapWhenVisible,
	expectVisible,
	tapSend
} from '~e2e/support/flows';
import { replyInThread, sendThreadReply, typeThreadReply } from '~e2e/support/threads';

afterEach(deleteCreatedUsers);

test('quotes a message inside a thread', { tags: ['test-1'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const room = await createRandomRoom(user);
	await loginWithDeepLink(fixtures, user);
	await navigateToRoom(fixtures, room.name);

	await sendMessage(fixtures, 'thread');
	await screen.getByTestId('room-view-messages').tap();
	await replyInThread(fixtures, 'thread');
	await sendThreadReply(fixtures, 'quotable');

	await loginWithDeepLink(fixtures, user);
	await navigateToRoom(fixtures, room.name);
	await tapWhenVisible(fixtures, 'message-thread-button-thread');
	const quotable = screen.getByTestId('message-content-quotable').first();
	await expect(quotable).toBeVisible({ timeout: LONG_TIMEOUT });

	await quotable.longPress();
	await expectVisible(fixtures, 'action-sheet');
	await tapWhenVisible(fixtures, 'message-actions-quote');
	await expect(screen.getByTestId(/^composer-quote-(?!remove-)/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId(/^composer-quote-remove-/)).toBeVisible();

	await typeThreadReply(fixtures, 'quotedinthread');
	await tapSend(fixtures);
	await expect(screen.getByTestId(/^message-content-.*quotedinthread$/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId(/^reply-.*-quotable$/)).toBeVisible({ timeout: LONG_TIMEOUT });
});
