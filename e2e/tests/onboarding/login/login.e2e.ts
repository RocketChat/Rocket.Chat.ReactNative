import { afterEach, test } from '@e2e-dev/mobile';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { launchApp, loginWithForm, navigateToLogin } from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

test('logs in with username and password', { tags: ['test-2'] }, async fixtures => {
	const user = await createUser();
	await launchApp(fixtures);
	await navigateToLogin(fixtures);
	await loginWithForm(fixtures, { username: user.email, password: user.password });
});
