import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { launchApp, navigateToRegister } from '~e2e/support/flows';
import { fillRegisterForm } from '~e2e/support/onboarding';

afterEach(deleteCreatedUsers);

test('rejects an email already in use', { tags: ['test-7'] }, async fixtures => {
	const user = await createUser();
	await launchApp(fixtures);
	await navigateToRegister(fixtures);
	await fillRegisterForm(fixtures, { ...user, username: `${user.username}new` });
	await expect(fixtures.screen.getByText(/Email already exists/)).toBeVisible();
});
