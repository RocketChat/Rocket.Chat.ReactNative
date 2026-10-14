import { afterEach, test } from '@e2e-dev/mobile';

import { createRandomRoom, createUser, deleteCreatedUsers, getDeepLink } from '~e2e/support/api';
import { data } from '~e2e/support/data';
import { loginWithDeepLink, openDeepLink, type Fixtures } from '~e2e/support/flows';
import { expectRoomTitle } from '~e2e/support/header';

afterEach(deleteCreatedUsers);

const coldStartRoomLink = async (fixtures: Fixtures, path: string, expectedName: string) => {
	await fixtures.device.closeApp();
	await openDeepLink(fixtures, getDeepLink('room', data.server, { path }));
	await expectRoomTitle(fixtures, expectedName);
};

test('opens groups and channels from deep links', { tags: ['test-6'] }, async fixtures => {
	const user = await createUser();
	const group = await createRandomRoom(user, 'p');
	const channel = await createRandomRoom(user, 'c');

	await loginWithDeepLink(fixtures, user);

	await coldStartRoomLink(fixtures, `group/${group.name}`, group.name);
	await coldStartRoomLink(fixtures, `group/${group._id}`, group.name);
	await coldStartRoomLink(fixtures, `channel/${channel.name}`, channel.name);
	await coldStartRoomLink(fixtures, `channel/${channel._id}`, channel.name);
});
