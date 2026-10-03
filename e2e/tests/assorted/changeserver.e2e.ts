import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import { data } from '~e2e/support/data';
import { loginWithDeepLink, LONG_TIMEOUT } from '~e2e/support/flows';
import { registerOnWorkspace } from '~e2e/support/onboarding';
import {
	addServerFromServersList,
	checkServer,
	deleteServer,
	openServersList,
	relaunchApp,
	selectServer
} from '~e2e/support/servers';

afterEach(deleteCreatedUsers);

test('switches between servers and keeps the last one on relaunch', { tags: ['test-5'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const room = await createRandomRoom(user);
	const roomItem = screen.getByTestId(`rooms-list-view-item-${room.name}`);

	await loginWithDeepLink(fixtures, user);

	await openServersList(fixtures);
	await addServerFromServersList(fixtures, data.alternateServer);
	await relaunchApp(fixtures, data.server);

	await openServersList(fixtures);
	await screen.getByTestId(`server-item-${data.alternateServer}`).tap();
	await expect(screen.getByTestId('workspace-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await registerOnWorkspace(fixtures);
	await expect(roomItem).toBeHidden({ timeout: LONG_TIMEOUT });

	await relaunchApp(fixtures, data.alternateServer);
	await checkServer(fixtures, data.alternateServer);

	await selectServer(fixtures, data.server);
	await expect(roomItem).toBeVisible({ timeout: LONG_TIMEOUT });
	await checkServer(fixtures, data.server);

	await relaunchApp(fixtures, data.server);
	await checkServer(fixtures, data.server);

	await deleteServer(fixtures, data.alternateServer);
	await openServersList(fixtures);
	await expect(screen.getByTestId(`server-item-${data.alternateServer}`)).toBeHidden({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId(`server-item-${data.server}`)).toBeVisible();
});
