import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { data } from '~e2e/support/data';
import { goBackUntil, loginWithDeepLink, logout, LONG_TIMEOUT } from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

test('remembers and deletes a server from history', { tags: ['test-5'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const historyItem = screen.getByTestId(`servers-history-${data.server}`);

	await loginWithDeepLink(fixtures, user);
	await logout(fixtures);

	await screen.getByTestId('servers-history-button').tap();
	await expect(screen.getByTestId('action-sheet')).toBeVisible();
	await historyItem.tap();
	await expect(screen.getByTestId('login-view-submit')).toBeVisible();
	await expect(screen.getByTestId('login-view-email')).toHaveValue(user.username);

	await goBackUntil(fixtures, 'new-server-view');
	await screen.getByTestId('servers-history-button').tap();
	await historyItem.swipe({ direction: 'right', momentum: 'slow' });
	await screen.getByTestId(`servers-history-${data.server}-delete`).tap();
	await expect(screen.getByTestId('servers-history-button')).toBeHidden({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId('new-server-view')).toBeVisible({ timeout: LONG_TIMEOUT });
});
