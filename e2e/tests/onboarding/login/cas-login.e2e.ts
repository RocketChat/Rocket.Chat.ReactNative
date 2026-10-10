import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { account, data } from '~e2e/support/data';
import {
	hideKeyboard,
	launchApp,
	navigateToLogin,
	LONG_TIMEOUT,
	fillWhenUncovered,
	tapWhenUncovered,
	type Fixtures
} from '~e2e/support/flows';
import { casField, dismissPasswordManagerPrompt } from '~e2e/support/onboarding';

const closeKeyboard = (fixtures: Fixtures) => hideKeyboard(fixtures, fixtures.screen.getByRole('button', /^(Done|selected)$/));

test('logs in with CAS', { tags: ['test-1'] }, async fixtures => {
	const { screen } = fixtures;
	await launchApp(fixtures);
	await navigateToLogin(fixtures, data.candidateServer);

	await expect(screen.getByText('Continue with CAS')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByText('Continue with CAS').tap();
	await expect(screen.getByText('CAS Login')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(casField(fixtures, 'password')).toBeVisible();
	await fillWhenUncovered(casField(fixtures, 'username'), account.cas.username);
	await closeKeyboard(fixtures);
	await fillWhenUncovered(casField(fixtures, 'password'), account.cas.password);
	await closeKeyboard(fixtures);
	await tapWhenUncovered(screen.getByText('Sign in'));
	const roomsList = screen.getByTestId('rooms-list-view');
	await dismissPasswordManagerPrompt(fixtures, [roomsList]);
	await expect(roomsList).toBeVisible({ timeout: LONG_TIMEOUT });
});
