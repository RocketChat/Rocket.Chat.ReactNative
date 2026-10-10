import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers, getDeepLink } from '~e2e/support/api';
import { data } from '~e2e/support/data';
import { loginWithDeepLink, openDeepLink, type Fixtures, LONG_TIMEOUT } from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

const coldStartRoomLink = async (fixtures: Fixtures, path: string, expectedName: string) => {
	await fixtures.device.closeApp();
	await openDeepLink(fixtures, getDeepLink('room', data.server, { path }));
	await expect(fixtures.screen.getByTestId(`room-view-title-${expectedName}`)).toBeVisible({ timeout: LONG_TIMEOUT });
};

test('opens groups and channels from deep links', { tags: ['test-8'] }, async fixtures => {
	const user = await createUser();
	const group = await createRandomRoom(user, 'p');
	const channel = await createRandomRoom(user, 'c');

	await loginWithDeepLink(fixtures, user);

	await coldStartRoomLink(fixtures, `group/${group.name}`, group.name);
	await coldStartRoomLink(fixtures, `group/${group._id}`, group.name);
	await coldStartRoomLink(fixtures, `channel/${channel.name}`, channel.name);
	await coldStartRoomLink(fixtures, `channel/${channel._id}`, channel.name);
});
