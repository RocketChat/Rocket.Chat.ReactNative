import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { goBackUntil, launchApp, navigateToLogin } from '~e2e/support/flows';

test('opens legal from login and register', { tags: ['test-1'] }, async fixtures => {
	const { screen } = fixtures;
	await launchApp(fixtures);
	await navigateToLogin(fixtures);

	await screen.getByTestId('login-view-more').tap();
	await expect(screen.getByTestId('legal-view')).toBeVisible();
	await goBackUntil(fixtures, 'login-view');

	await screen.scrollUntilVisible(screen.getByText('Create an account'));
	await screen.getByText('Create an account').tap();
	await screen.getByTestId('register-view-more').tap();
	await expect(screen.getByTestId('legal-view')).toBeVisible();
	await expect(screen.getByTestId('legal-privacy-button')).toBeVisible();
});
