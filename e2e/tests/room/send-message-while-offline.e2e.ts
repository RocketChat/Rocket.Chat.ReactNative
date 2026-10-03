import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers, sendMessage as sendApiMessage } from '~e2e/support/api';
import { loginWithDeepLink, navigateToRoom, sendMessage, LONG_TIMEOUT } from '~e2e/support/flows';
import { random } from '~e2e/support/random';

afterEach(async ({ device }) => {
	await device.setAirplaneMode(false);
});
afterEach(deleteCreatedUsers);

test(
	'opens a stored room offline and marks an unsent message',
	{ tags: ['test-3'], platforms: ['android'], timeout: 600_000 },
	async fixtures => {
		const { screen, device, app } = fixtures;
		const user = await createUser();
		const sender = await createUser();
		const tag = `offline-send-${random(6)}`;
		const storedMessage = screen.getByTestId(`message-content-${tag}-stored`);

		await sendApiMessage(sender, `@${user.username}`, `${tag}-stored`);
		await loginWithDeepLink(fixtures, user);
		await navigateToRoom(fixtures, sender.username);
		await expect(storedMessage).toBeVisible({ timeout: LONG_TIMEOUT });

		await device.setAirplaneMode(true);
		await device.closeApp();
		await app.open();
		await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
		await navigateToRoom(fixtures, sender.username);
		await expect(storedMessage).toBeVisible({ timeout: LONG_TIMEOUT });

		await expect(screen.getByTestId('message-composer-input')).toBeVisible({ timeout: LONG_TIMEOUT });
		await sendMessage(fixtures, `${tag}-unsent`);
		await expect(screen.getByTestId(`message-error-${tag}-unsent`)).toBeVisible({ timeout: LONG_TIMEOUT });
		await expect(storedMessage).toBeVisible();
	}
);
