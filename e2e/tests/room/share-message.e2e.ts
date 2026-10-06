import { afterEach, test } from '@e2e-dev/mobile';

import { createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	loginWithDeepLink,
	searchAndNavigateRoom,
	sendMessage,
	type Fixtures,
	tapWhenVisible,
	backToRoomsList,
	expectHidden,
	expectVisible,
	openMessageActions,
	fillWhenUncovered
} from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

const forwardMessageTo = async (fixtures: Fixtures, username: string) => {
	const { screen } = fixtures;
	await expectVisible(fixtures, 'forward-message-view');
	await tapWhenVisible(fixtures, 'select-person-or-channel');
	await fillWhenUncovered(screen.getByTestId('multi-select-search'), username);
	await tapWhenVisible(fixtures, `multi-select-item-${username.toLowerCase()}`);
	await tapWhenVisible(fixtures, 'action-sheet-handle');
	await expectHidden(fixtures, 'multi-select-search');
	await tapWhenVisible(fixtures, 'forward-message-view-send');
};

test('forwards a message to a direct message', { tags: ['test-9'], timeout: 300_000 }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const otherUser = await createUser();
	const room = await createRandomRoom(user);

	await loginWithDeepLink(fixtures, user);
	await searchAndNavigateRoom(fixtures, otherUser.username);
	await sendMessage(fixtures, 'Hello user');
	await backToRoomsList(fixtures);

	await searchAndNavigateRoom(fixtures, room.name);
	await sendMessage(fixtures, 'Hello room');
	await openMessageActions(fixtures, 'Hello room');
	await screen.getByText('Forward').tap();
	await forwardMessageTo(fixtures, otherUser.username);
	await expectVisible(fixtures, `room-view-title-${room.name}`);

	await backToRoomsList(fixtures);
	await searchAndNavigateRoom(fixtures, otherUser.username);
	await expectVisible(fixtures, 'message-content-Hello user');
	await expectVisible(fixtures, `reply-${user.name}-Hello room`);
});
