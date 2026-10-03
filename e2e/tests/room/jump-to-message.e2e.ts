import { test } from '@e2e-dev/mobile';
import { expect, type Locator } from 'e2e';

import { adminCredentials } from '~e2e/support/api';
import { delay } from '~e2e/support/timing';
import {
	loginWithDeepLink,
	searchAndNavigateRoom,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenVisible,
	escapeRegExp,
	expectVisible,
	succeeds,
	tapUntilVisible
} from '~e2e/support/flows';

const ROOM = 'jumping';
const THREAD_ROOM = 'jumping-thread';

const testIdContaining = ({ screen }: Fixtures, text: string) => screen.getByTestId(new RegExp(escapeRegExp(text))).first();

const expectMessages = async (fixtures: Fixtures, numbers: readonly number[]) => {
	for (const number of numbers) {
		await expectVisible(fixtures, `message-content-${number}`);
	}
};

const jumpToMessageWithLongPress = async (fixtures: Fixtures, target: Locator) => {
	const { screen } = fixtures;
	await expect(target).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapUntilVisible(fixtures, target, 'action-sheet', 'longPress');
	await expect(screen.getByText('Jump to message')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByText('Jump to message').tap();
};

const jumpToMessageFrom = (fixtures: Fixtures, text: string) =>
	jumpToMessageWithLongPress(fixtures, testIdContaining(fixtures, text));

const expectThreadMessage = async (fixtures: Fixtures, text: string) => {
	await expectVisible(fixtures, 'room-view-title-thread 1');
	const message = testIdContaining(fixtures, `message-content-${text}`);
	if (fixtures.platform === 'android') {
		await fixtures.screen
			.getByTestId('room-view-messages')
			.scrollUntilVisible(message, { direction: 'down', timeout: LONG_TIMEOUT });
	} else {
		await expect(message).toBeVisible({ timeout: LONG_TIMEOUT });
	}
	await message.tap();
};

const leaveThread = async (fixtures: Fixtures) => {
	await fixtures.screen.getByTestId('header-back').tap();
	await expectVisible(fixtures, `room-view-title-${THREAD_ROOM}`);
};

const clearCache = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	await expectVisible(fixtures, 'room-view');
	await screen.getByTestId('header-back').tap();
	await tapWhenVisible(fixtures, 'rooms-list-view-sidebar');
	await tapWhenVisible(fixtures, 'sidebar-settings');
	await tapWhenVisible(fixtures, 'settings-view-clear-cache');
	await expect(screen.getByText(/This will clear all your offline data/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByRole('button', { name: /^Clear$/i }).tap();
	await expectVisible(fixtures, 'rooms-list-view');
};

const searchMessage = async (fixtures: Fixtures, text: string) => {
	const { screen } = fixtures;
	await tapWhenVisible(fixtures, 'room-view-search');
	await expectVisible(fixtures, 'search-messages-view');
	await tapWhenVisible(fixtures, 'search-message-view-input');
	await screen.getByTestId('search-message-view-input').pressSequentially(text);
	await tapWhenVisible(fixtures, `message-content-${text}`);
};

const PAGINATION_TIMEOUT = 120_000;
const SETTLE_TIMEOUT = 5_000;
const SETTLE_POLL_INTERVAL = 300;
const LOAD_TAP_ATTEMPTS = 3;
const LOAD_RESPONSE_TIMEOUT = 10_000;

const boundsWhenSettled = async (target: Locator) => {
	const deadline = Date.now() + SETTLE_TIMEOUT;
	let previous = await target.boundingBox();
	while (Date.now() < deadline) {
		await delay(SETTLE_POLL_INTERVAL);
		const current = await target.boundingBox();
		if (previous && current && previous.y === current.y) {
			return current;
		}
		previous = current;
	}
	return previous;
};

const tapCenterUntilVisible = async ({ screen }: Fixtures, target: Locator, expectedTestId: string) => {
	const expected = screen.getByTestId(expectedTestId);
	for (let attempt = 1; attempt <= LOAD_TAP_ATTEMPTS; attempt += 1) {
		const box = await boundsWhenSettled(target);
		if (box) {
			await screen.tapAt({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
		}
		if (await succeeds(expect(expected).toBeVisible({ timeout: LOAD_RESPONSE_TIMEOUT }))) {
			return;
		}
	}
	await expect(expected).toBeVisible({ timeout: LONG_TIMEOUT });
};

const scrollUntilLoaded = ({ screen }: Fixtures, target: Locator, direction: 'up' | 'down', timeout = LONG_TIMEOUT) =>
	screen.scrollUntilVisible(target, { direction, timeout });

test('jumps to messages', { tags: ['test-5'], timeout: 900_000 }, async fixtures => {
	const { screen } = fixtures;
	await loginWithDeepLink(fixtures, adminCredentials());

	await searchAndNavigateRoom(fixtures, ROOM);
	await expectVisible(fixtures, 'message-content-300');
	await jumpToMessageFrom(fixtures, 'Quote first message');
	await expectMessages(fixtures, [1, 2]);
	await tapWhenVisible(fixtures, 'nav-jump-to-bottom');
	await expect(testIdContaining(fixtures, "Go to jumping-thread's thread")).toBeVisible({ timeout: LONG_TIMEOUT });
	await clearCache(fixtures);

	await searchAndNavigateRoom(fixtures, ROOM);
	await expectVisible(fixtures, 'room-view-messages');
	await expectVisible(fixtures, 'message-content-300');
	await scrollUntilLoaded(fixtures, screen.getByTestId('message-content-249'), 'up', PAGINATION_TIMEOUT);
	await clearCache(fixtures);

	await searchAndNavigateRoom(fixtures, ROOM);
	await searchMessage(fixtures, '30');
	await expectMessages(fixtures, [29, 30, 31]);

	const loadOlder = screen.getByText('Load older', { visible: true });
	await scrollUntilLoaded(fixtures, loadOlder, 'up');
	await expectVisible(fixtures, 'message-content-5');
	await tapCenterUntilVisible(fixtures, loadOlder, 'message-content-4');
	await scrollUntilLoaded(fixtures, screen.getByTestId('message-content-1'), 'up');
	await scrollUntilLoaded(fixtures, screen.getByTestId('message-content-50'), 'down');
	const loadNewer = screen.getByText('Load newer', { visible: true });
	await scrollUntilLoaded(fixtures, loadNewer, 'down');
	for (const lastLoaded of [104, 154, 202]) {
		await expect(loadNewer).toBeVisible({ timeout: LONG_TIMEOUT });
		await tapCenterUntilVisible(fixtures, loadNewer, `message-content-${lastLoaded}`);
	}
	await screen.getByTestId('header-back').tap();

	await searchAndNavigateRoom(fixtures, ROOM);
	await jumpToMessageFrom(fixtures, "Go to jumping-thread's thread");
	await expectThreadMessage(fixtures, "Go to jumping-thread's thread");
	await leaveThread(fixtures);

	const threadMessageInRoom = testIdContaining(fixtures, 'thread message sent to main room');
	await expect(threadMessageInRoom).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapUntilVisible(fixtures, threadMessageInRoom, 'room-view-title-thread 1');
	await expectThreadMessage(fixtures, 'thread message sent to main room');
	await leaveThread(fixtures);

	await jumpToMessageWithLongPress(fixtures, screen.getByTestId(/reply-.*-quoted/).first());
	await expectThreadMessage(fixtures, 'quoted');
	await leaveThread(fixtures);

	await searchMessage(fixtures, 'to be searched');
	await expectThreadMessage(fixtures, 'to be searched');
});
