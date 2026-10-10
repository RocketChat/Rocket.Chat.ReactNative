import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { adminCredentials } from '~e2e/support/api';
import { loginWithDeepLink, LONG_TIMEOUT } from '~e2e/support/flows';
import { openSidebar } from '~e2e/support/settings';

test('opens the admin panel already logged in', { tags: ['test-1'] }, async fixtures => {
	const { screen } = fixtures;
	await loginWithDeepLink(fixtures, adminCredentials());

	await openSidebar(fixtures);
	await screen.getByTestId('sidebar-admin').tap();
	await expect(screen.getByTestId('admin-panel-view')).toBeVisible({ timeout: LONG_TIMEOUT });

	await expect(screen.getByText(/Deployment ID/)).toBeVisible({ timeout: 120_000 });
	await expect(screen.getByText(/Email or username/)).toBeHidden();
});
