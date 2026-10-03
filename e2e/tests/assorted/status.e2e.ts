import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { expectAllVisible, tapUntilHidden, loginWithDeepLink, LONG_TIMEOUT, tapWhenVisible } from '~e2e/support/flows';
import { openSidebar } from '~e2e/support/settings';

afterEach(deleteCreatedUsers);

test('changes status and status text', { tags: ['test-8'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	await loginWithDeepLink(fixtures, user);
	await openSidebar(fixtures);
	await tapWhenVisible(fixtures, 'sidebar-custom-status-online');
	await expect(screen.getByTestId('status-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expectAllVisible(fixtures, [
		'status-view-input',
		'status-view-online',
		'status-view-busy',
		'status-view-away',
		'status-view-offline',
		'status-view-submit'
	]);

	await screen.getByTestId('status-view-busy').tap();
	await screen.getByTestId('status-view-submit').tap();
	await expect(screen.getByTestId('sidebar-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'sidebar-custom-status-busy');

	await expect(screen.getByTestId('status-view-input')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('status-view-input').pressSequentially('status-text-new');
	await tapWhenVisible(fixtures, 'status-view-busy');
	await tapUntilHidden(fixtures, 'status-view-submit', 'status-view');
	await expect(screen.getByText('status-text-new').first()).toBeVisible({ timeout: LONG_TIMEOUT });
});
