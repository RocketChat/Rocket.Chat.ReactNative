import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { launchApp, navigateToLogin, LONG_TIMEOUT, fillWhenUncovered } from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

test('requests a password reset email', { tags: ['test-2'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();

	await launchApp(fixtures);
	await navigateToLogin(fixtures);
	await screen.getByTestId('login-view-forgot-password').tap();
	await expect(screen.getByTestId('forgot-password-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await fillWhenUncovered(screen.getByTestId('forgot-password-view-email'), user.email);
	await screen.getByTestId('forgot-password-view-submit').tap();
	await expect(
		screen.getByText(
			"If this email is registered, we'll send instructions on how to reset your password. If you do not receive an email shortly, please come back and try again."
		)
	).toBeVisible({ timeout: LONG_TIMEOUT });
});
