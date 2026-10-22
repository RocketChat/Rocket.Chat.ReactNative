import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUserWithPasswordChange, deleteCreatedUsers } from '~e2e/support/api';
import {
	fillWhenUncovered,
	hideKeyboard,
	loginWithDeepLink,
	loginWithForm,
	logout,
	navigateToLogin,
	LONG_TIMEOUT
} from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

const NEW_PASSWORD = '123456';

test('requires a password change on first login', { tags: ['test-5'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUserWithPasswordChange();

	await loginWithDeepLink(fixtures, user);
	await expect(screen.getByText('You need to change your password')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('change-password-required-button').tap();
	await fillWhenUncovered(screen.getByTestId('change-password-view-new-password'), NEW_PASSWORD);
	await hideKeyboard(fixtures);
	await fillWhenUncovered(screen.getByTestId('change-password-view-confirm-new-password'), NEW_PASSWORD);
	await hideKeyboard(fixtures);
	await screen.getByTestId('change-password-view-set-new-password-button').tap();
	await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });

	await logout(fixtures);
	await navigateToLogin(fixtures);
	await loginWithForm(fixtures, { username: user.username, password: NEW_PASSWORD });
	await expect(screen.getByTestId('rooms-list-view-item-general')).toBeVisible({ timeout: LONG_TIMEOUT });
});
