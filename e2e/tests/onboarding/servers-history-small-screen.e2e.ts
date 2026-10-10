import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { data } from '~e2e/support/data';
import { logout, LONG_TIMEOUT } from '~e2e/support/flows';
import { loginWithDeepLinkIntoRunningApp } from '~e2e/support/onboarding';

afterEach(deleteCreatedUsers);

test(
	'fully renders the servers history sheet on a small screen',
	{ tags: ['test-10'], platforms: ['ios'], timeout: 300_000 },
	async fixtures => {
		const { screen } = fixtures;
		const user = await createUser();
		const historyItem = screen.getByTestId(`servers-history-${data.server}`);

		await loginWithDeepLinkIntoRunningApp(fixtures, user);
		await logout(fixtures);

		await expect(screen.getByTestId('servers-history-button')).toBeVisible({ timeout: LONG_TIMEOUT });
		await screen.getByTestId('servers-history-button').tap();
		await expect(screen.getByTestId('action-sheet')).toBeVisible({ timeout: LONG_TIMEOUT });
		await expect(historyItem).toBeVisible();
		await historyItem.tap();
		await expect(screen.getByTestId('login-view-submit')).toBeVisible({ timeout: LONG_TIMEOUT });
	}
);
