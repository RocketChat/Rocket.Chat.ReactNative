import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { data } from '~e2e/support/data';
import { loginWithDeepLink, LONG_TIMEOUT } from '~e2e/support/flows';
import { registerOnWorkspace } from '~e2e/support/onboarding';
import { addServerFromServersList, checkServer, deleteServer, openServersList } from '~e2e/support/servers';

afterEach(deleteCreatedUsers);

test('deletes a server from the servers list', { tags: ['test-8'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();

	await loginWithDeepLink(fixtures, user);
	await checkServer(fixtures, data.server);

	await openServersList(fixtures);
	await addServerFromServersList(fixtures, data.alternateServer);
	await registerOnWorkspace(fixtures);
	await checkServer(fixtures, data.alternateServer);

	await deleteServer(fixtures, data.server);
	await openServersList(fixtures);
	await expect(screen.getByTestId(`server-item-${data.server}`)).toBeHidden({ timeout: LONG_TIMEOUT });
});
