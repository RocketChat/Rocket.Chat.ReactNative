import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { deleteCreatedUsers, trackUserForCleanup } from '~e2e/support/api';
import { launchApp, navigateToRegister, LONG_TIMEOUT } from '~e2e/support/flows';
import { fillRegisterForm } from '~e2e/support/onboarding';
import { randomUser } from '~e2e/support/random';

afterEach(deleteCreatedUsers);

test('creates an account', { tags: ['test-6'] }, async fixtures => {
	const user = randomUser();
	trackUserForCleanup(user);
	await launchApp(fixtures);
	await navigateToRegister(fixtures);
	await fillRegisterForm(fixtures, user);
	await expect(fixtures.screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
});
