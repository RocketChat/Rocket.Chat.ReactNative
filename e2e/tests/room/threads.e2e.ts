import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { openRoom } from '~e2e/support/appduct';
import { createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import { type Fixtures, loginWithDeepLink, sendMessage, LONG_TIMEOUT, tapWhenVisible, goBack } from '~e2e/support/flows';
import { expectRoomTitle, followThreadButton, threadsButton } from '~e2e/support/header';
import { deleteMessage } from '~e2e/support/room';
import {
	expectHiddenSoon,
	leaveThread,
	openThreadFromButton,
	replyInThread,
	sendThreadReply,
	THREAD_INPUT,
	typeThreadReply
} from '~e2e/support/threads';

const THREAD = 'thread';
const THREAD_REPLY_PLACEHOLDER = /Add thread reply/;

const threadReplyPlaceholder = ({ screen }: Fixtures) => screen.getByRole('textbox', { name: THREAD_REPLY_PLACEHOLDER });

afterEach(deleteCreatedUsers);

test('creates, follows, drafts and navigates threads', { tags: ['test-4'], timeout: 600_000 }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const room = await createRandomRoom(user);

	await loginWithDeepLink(fixtures, user);
	await openRoom(fixtures, room.name);
	await expect(screen.getByTestId('room-header')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(threadsButton(fixtures)).toBeVisible({ timeout: LONG_TIMEOUT });

	await sendMessage(fixtures, THREAD);
	await replyInThread(fixtures, THREAD);
	await sendThreadReply(fixtures, 'replied');
	await leaveThread(fixtures, THREAD, room.name);

	await openThreadFromButton(fixtures, THREAD);
	await tapWhenVisible(fixtures, followThreadButton(fixtures, true));
	await tapWhenVisible(fixtures, followThreadButton(fixtures, false));
	await expect(followThreadButton(fixtures, true)).toBeVisible({ timeout: LONG_TIMEOUT });

	await sendThreadReply(fixtures, 'threadonly');
	await leaveThread(fixtures, THREAD, room.name);
	await expect(screen.getByTestId(`message-content-${THREAD}`)).toBeVisible({ timeout: LONG_TIMEOUT });
	await expectHiddenSoon(fixtures, 'message-content-threadonly');

	await openThreadFromButton(fixtures, THREAD);
	await typeThreadReply(fixtures, 'sendToChannel');
	await screen.getByTestId('send-to-channel-unchecked').tap();
	await screen.getByTestId('message-composer-send').tap();
	await leaveThread(fixtures, THREAD, room.name);
	await expect(screen.getByTestId('message-content-sendToChannel')).toBeVisible({ timeout: LONG_TIMEOUT });

	await sendMessage(fixtures, 'dummymessagebetweenthethread');
	await openThreadFromButton(fixtures, THREAD);
	await typeThreadReply(fixtures, 'navthreadname');
	await screen.getByTestId('message-composer-send-to-channel').tap();
	await screen.getByTestId('message-composer-send').tap();
	await leaveThread(fixtures, THREAD, room.name);
	await tapWhenVisible(fixtures, 'message-content-navthreadname');
	await expectRoomTitle(fixtures, THREAD);
	await leaveThread(fixtures, THREAD, room.name);

	await tapWhenVisible(fixtures, threadsButton(fixtures));
	await expect(screen.getByTestId('thread-messages-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, `thread-messages-view-${THREAD}`);
	await expectRoomTitle(fixtures, THREAD);
	await goBack(fixtures);
	await expect(screen.getByTestId('room-view-messages')).toBeVisible({ timeout: LONG_TIMEOUT });

	await openThreadFromButton(fixtures, THREAD);
	await typeThreadReply(fixtures, 'draftthread');
	await goBack(fixtures);
	await openThreadFromButton(fixtures, THREAD);
	await expect(screen.getByTestId(THREAD_INPUT)).toHaveValue('draftthread', { timeout: LONG_TIMEOUT });
	await screen
		.getByTestId(THREAD_INPUT)
		.clear()
		.catch(() => undefined);
	await expect(threadReplyPlaceholder(fixtures)).toBeVisible({ timeout: LONG_TIMEOUT });
	await goBack(fixtures);
	await openThreadFromButton(fixtures, THREAD);
	await expect(screen.getByTestId(THREAD_INPUT)).not.toHaveValue('draftthread', { timeout: LONG_TIMEOUT });
	await expect(screen.getByText(/draftthread/)).toBeHidden();
	await expect(threadReplyPlaceholder(fixtures)).toBeVisible({ timeout: LONG_TIMEOUT });
	await leaveThread(fixtures, THREAD, room.name);

	const countedThread = 'thread-message-count';
	await sendMessage(fixtures, countedThread);
	await replyInThread(fixtures, countedThread);
	await sendThreadReply(fixtures, 'replied');
	await deleteMessage(fixtures, 'replied');
	await goBack(fixtures);
	await expectRoomTitle(fixtures, room.name);
	await expect(screen.getByTestId('thread-count-0')).toBeVisible({ timeout: LONG_TIMEOUT });
});
