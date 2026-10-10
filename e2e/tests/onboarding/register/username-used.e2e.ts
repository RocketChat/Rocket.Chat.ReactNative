import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { launchApp, navigateToRegister } from '~e2e/support/flows';
import { fillRegisterForm } from '~e2e/support/onboarding';

afterEach(deleteCreatedUsers);

test('rejects a username already in use', { tags: ['test-8'] }, async fixtures => {
	const user = await createUser();
	await launchApp(fixtures);
	await navigateToRegister(fixtures);
	await fillRegisterForm(fixtures, { ...user, email: `new${user.email}` });
	await expect(fixtures.screen.getByText('Username is already in use.')).toBeVisible();
});
