import { expect } from 'e2e';

import { type Fixtures, goBackUntil, LONG_TIMEOUT, openMessageActions, succeeds, tapWhenVisible } from './flows';

const SHORT_TIMEOUT = 5_000;

export const THREAD_INPUT = 'message-composer-input-thread';

export const replyInThread = async (fixtures: Fixtures, message: string) => {
	const { screen } = fixtures;
	await openMessageActions(fixtures, message);
	await expect(screen.getByText('Reply in thread')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByText('Reply in thread').tap();
	await expect(screen.getByTestId(`room-view-title-${message}`)).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId(THREAD_INPUT)).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const openThreadFromButton = async (fixtures: Fixtures, thread: string) => {
	await tapWhenVisible(fixtures, `message-thread-button-${thread}`);
	await expect(fixtures.screen.getByTestId(`room-view-title-${thread}`)).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const typeThreadReply = async ({ screen }: Fixtures, text: string) => {
	await screen.getByTestId(THREAD_INPUT).tap();
	await screen.getByTestId(THREAD_INPUT).fill(text);
};

export const sendThreadReply = async (fixtures: Fixtures, text: string) => {
	const { screen } = fixtures;
	await typeThreadReply(fixtures, text);
	await screen.getByTestId('message-composer-send').tap();
	const sent = screen.getByTestId(`message-content-${text}`);
	if (await sent.isHidden()) {
		const cleared = await succeeds(expect(screen.getByTestId(THREAD_INPUT)).toHaveValue('', { timeout: SHORT_TIMEOUT }));
		if (!cleared) {
			await screen.getByTestId('message-composer-send').tap();
		}
	}
	await expect(sent).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const leaveThread = async (fixtures: Fixtures, thread: string, room: string) => {
	const { screen } = fixtures;
	await goBackUntil(fixtures, `room-view-title-${thread}`, 'hidden');
	await expect(screen.getByTestId(`room-view-title-${room}`)).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const expectHiddenSoon = async ({ screen }: Fixtures, testId: string) => {
	await expect(screen.getByTestId(testId)).toBeHidden({ timeout: SHORT_TIMEOUT });
};
