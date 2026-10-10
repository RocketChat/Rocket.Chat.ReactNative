import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { loginWithDeepLink, LONG_TIMEOUT } from '~e2e/support/flows';

const MAX_BACK_PRESSES = 2;

afterEach(deleteCreatedUsers);

test('closes the rooms search with the back key', { tags: ['test-5'], platforms: ['android'] }, async fixtures => {
	const { screen, device } = fixtures;
	const user = await createUser();
	await loginWithDeepLink(fixtures, user);

	await screen.getByTestId('rooms-list-view-search').tap();
	await expect(screen.getByTestId('rooms-list-view')).toBeVisible();
	await expect(screen.getByTestId('rooms-list-view-search-input')).toBeVisible({ timeout: LONG_TIMEOUT });
	const searchInput = screen.getByTestId('rooms-list-view-search-input');
	for (let press = 0; press < MAX_BACK_PRESSES && (await searchInput.isVisible()); press += 1) {
		await device.back();
	}
	await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId('rooms-list-view-search-input')).toBeHidden({ timeout: LONG_TIMEOUT });
});
