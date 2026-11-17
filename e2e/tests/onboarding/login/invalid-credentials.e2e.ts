import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { launchApp, navigateToLogin, submitLoginForm } from '~e2e/support/flows';

test('rejects invalid credentials', { tags: ['test-1'] }, async fixtures => {
	await launchApp(fixtures);
	await navigateToLogin(fixtures);
	await submitLoginForm(fixtures, { username: 'someusername', password: 'NotMyActualPassword' });
	await expect(fixtures.screen.getByText('Your credentials were rejected! Please try again.')).toBeVisible();
});
