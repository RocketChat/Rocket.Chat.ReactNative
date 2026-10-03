import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers, sendMessage } from '~e2e/support/api';
import { loginWithDeepLink, navigateToRoom, LONG_TIMEOUT } from '~e2e/support/flows';
import { random } from '~e2e/support/random';
import { delay } from '~e2e/support/timing';

const OFFLINE_MESSAGES = ['1', '2', '3'];
const OFFLINE_DELIVERY_WINDOW = 5_000;

afterEach(async ({ device }) => {
	await device.setAirplaneMode(false);
});
afterEach(deleteCreatedUsers);

test(
	'delivers messages received while the device was offline',
	{ tags: ['test-3'], platforms: ['android'], timeout: 600_000 },
	async fixtures => {
		const { screen, device } = fixtures;
		const user = await createUser();
		const sender = await createUser();
		const tag = `offline-${random(6)}`;
		const sendFromSender = (suffix: string) => sendMessage(sender, `@${user.username}`, `${tag}-${suffix}`);
		const messageContent = (suffix: string) => screen.getByTestId(`message-content-${tag}-${suffix}`);

		await sendFromSender('baseline');
		await loginWithDeepLink(fixtures, user);
		await navigateToRoom(fixtures, sender.username);
		await expect(messageContent('baseline')).toBeVisible({ timeout: LONG_TIMEOUT });

		await device.setAirplaneMode(true);
		for (const suffix of OFFLINE_MESSAGES) {
			await sendFromSender(suffix);
		}
		await delay(OFFLINE_DELIVERY_WINDOW);
		for (const suffix of OFFLINE_MESSAGES) {
			await expect(messageContent(suffix)).toBeHidden();
		}
		await device.setAirplaneMode(false);

		await expect(messageContent('3')).toBeVisible({ timeout: 120_000 });
		await expect(messageContent('1')).toBeVisible();
		await expect(messageContent('2')).toBeVisible();
	}
);
