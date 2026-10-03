import type { Locator } from 'e2e';
import { expect } from 'e2e';

import { escapeRegExp, type Fixtures } from './flows';

export const runSlashCommand = async ({ screen }: Fixtures, command: string) => {
	await screen.getByTestId('message-composer-input').fill(`/${command}`);
	await expect(screen.getByTestId(`autocomplete-item-${command}`)).toBeVisible({ timeout: 10_000 });
	await screen.getByTestId(`autocomplete-item-${command}`).tap();
	await screen.getByTestId('message-composer-send').tap();
};

const tapMessageBodyBelowHeader = async ({ screen }: Fixtures, message: Locator, username: string) => {
	const messageBox = await message.boundingBox();
	const headerBox = await message.getByTestId(`username-header-${username}`).boundingBox();
	if (!messageBox || !headerBox) {
		throw new Error(`The message from ${username} has no bounds to tap`);
	}
	const headerBottom = headerBox.y + headerBox.height;
	const messageBottom = messageBox.y + messageBox.height;
	await screen.tapAt({ x: messageBox.x + messageBox.width / 2, y: (headerBottom + messageBottom) / 2 });
};

const botMessages = ({ screen }: Fixtures, botUsername: string) =>
	screen.getByRole('button', new RegExp(`^${escapeRegExp(botUsername)} `));

const tapBotMessageBody = async (fixtures: Fixtures, botUsername: string) => {
	const botMessage = botMessages(fixtures, botUsername);
	await expect(botMessage).toBeVisible({ timeout: 10_000 });
	await tapMessageBodyBelowHeader(fixtures, botMessage, botUsername);
};

export const tapBotMessageButton = async (
	fixtures: Fixtures,
	{ botUsername, buttonName }: { botUsername: string; buttonName: string }
) => {
	if (fixtures.platform === 'ios') {
		await tapBotMessageBody(fixtures, botUsername);
		return;
	}
	await expect(botMessages(fixtures, botUsername)).toBeVisible({ timeout: 10_000 });
	await fixtures.screen.getByRole('button', buttonName).tap();
};

const BOT_MESSAGES_WITH_REPLY = 2;

export const expectBotReply = async (fixtures: Fixtures, botUsername: string, replyText: RegExp) => {
	if (fixtures.platform === 'ios') {
		await expect(botMessages(fixtures, botUsername)).toHaveCount(BOT_MESSAGES_WITH_REPLY, { timeout: 10_000 });
		return;
	}
	await expect(fixtures.screen.getByText(replyText)).toBeVisible({ timeout: 10_000 });
};
