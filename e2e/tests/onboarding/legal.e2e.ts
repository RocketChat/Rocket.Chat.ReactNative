import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { goBackUntil, launchApp, navigateToLogin } from '~e2e/support/flows';
import { tapHeaderItem } from '~e2e/support/header';

test('opens legal from login and register', { tags: ['test-7'] }, async fixtures => {
	const { screen } = fixtures;
	await launchApp(fixtures);
	await navigateToLogin(fixtures);

	await tapHeaderItem(fixtures, 'login-view-more', 'More');
	await expect(screen.getByTestId('legal-view')).toBeVisible();
	await goBackUntil(fixtures, 'login-view');

	await screen.scrollUntilVisible(screen.getByText('Create an account'));
	await screen.getByText('Create an account').tap();
	await tapHeaderItem(fixtures, 'register-view-more', 'More');
	await expect(screen.getByTestId('legal-view')).toBeVisible();
	await expect(screen.getByTestId('legal-privacy-button')).toBeVisible();
});
