import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	loginWithDeepLink,
	searchAndNavigateRoom,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenVisible,
	escapeRegExp,
	expectVisible
} from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

const ROOM = 'maestro-message-clickable-test';
const LINK = 'https://www.rocket.chat';
const THREAD_TITLE = /^room-view-title-message with thread$/i;

const linkMessage = `message-content-Link with text ${LINK}`;
const channelMentionMessage = 'message-content-channel: #detox-public';
const userMentionMessage = 'message-content-user mention @e2e_admin';
const threadMessage = 'message-content-Message with thread';
const threadReply = 'message-content-a message in thread';
const threadButton = /^message-thread-button-message with thread$/i;

const expectBackInRoom = async (fixtures: Fixtures) => {
	await expectVisible(fixtures, `room-view-title-${ROOM}`);
};

const expectLinkAlert = async ({ screen }: Fixtures, title: string) => {
	await expect(screen.getByText(title)).toBeVisible({ timeout: 10_000 });
	await expect(screen.getByText(LINK).first()).toBeVisible();
	await screen.getByRole('button', { name: /^OK$/i }).tap();
	await expect(screen.getByText(title)).toBeHidden({ timeout: 10_000 });
};

const expectThreadOpened = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	await expect(screen.getByTestId(THREAD_TITLE)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('header-back').tap();
	await expectBackInRoom(fixtures);
};

const inlineTarget = ({ screen, platform }: Fixtures, messageTestId: string, name: string) =>
	platform === 'android'
		? screen.getByRole('button', { name: new RegExp(`^${escapeRegExp(name)}$`) })
		: screen.getByTestId(messageTestId);

test('opens markdown mentions, links and threads', { tags: ['test-9'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	await loginWithDeepLink(fixtures, user);
	await searchAndNavigateRoom(fixtures, ROOM);
	for (const testId of [linkMessage, channelMentionMessage, userMentionMessage, threadMessage]) {
		await expectVisible(fixtures, testId);
	}
	await expect(screen.getByTestId(threadButton)).toBeVisible();

	await inlineTarget(fixtures, channelMentionMessage, 'detox-public').tap();
	await expectVisible(fixtures, 'room-info-view');
	await expect(screen.getByText('detox-public', { exact: false }).first()).toBeVisible();
	await screen.getByTestId('custom-header-back').tap();
	await expectBackInRoom(fixtures);

	await inlineTarget(fixtures, linkMessage, LINK).tap();
	await expectLinkAlert(fixtures, 'Link Pressed');
	await inlineTarget(fixtures, linkMessage, LINK).longPress();
	await expectLinkAlert(fixtures, 'Link Long Pressed');

	await inlineTarget(fixtures, userMentionMessage, 'e2e_admin').tap();
	await expect(screen.getByText('User info', { exact: false }).first()).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByText('e2e_admin', { exact: false }).first()).toBeVisible();
	await screen.getByTestId('custom-header-back').tap();
	await expectBackInRoom(fixtures);

	await screen.getByTestId(threadMessage).tap();
	await expectThreadOpened(fixtures);

	await screen.getByTestId(threadButton).tap();
	await expectThreadOpened(fixtures);

	await tapWhenVisible(fixtures, threadReply);
	await expect(screen.getByTestId(THREAD_TITLE)).toBeVisible({ timeout: LONG_TIMEOUT });
});
