import { afterEach, test } from '~e2e/support/fixtures';

import { openRoom } from '~e2e/support/appduct';
import { createDM, createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	loginWithDeepLink,
	sendMessage,
	type Fixtures,
	tapWhenVisible,
	backToRoomsList,
	expectHidden,
	expectVisible,
	openMessageActions,
	fillWhenUncovered
} from '~e2e/support/flows';
import { expectRoomTitle, tapHeaderItem } from '~e2e/support/header';

afterEach(deleteCreatedUsers);

const forwardMessageTo = async (fixtures: Fixtures, username: string) => {
	const { screen } = fixtures;
	await expectVisible(fixtures, 'forward-message-view');
	await tapWhenVisible(fixtures, 'select-person-or-channel');
	await fillWhenUncovered(screen.getByTestId('multi-select-search'), username);
	await tapWhenVisible(fixtures, `multi-select-item-${username.toLowerCase()}`);
	await tapWhenVisible(fixtures, 'action-sheet-handle');
	await expectHidden(fixtures, 'multi-select-search');
	await tapHeaderItem(fixtures, 'forward-message-view-send', 'Send');
};

test('forwards a message to a direct message', { tags: ['test-3'], timeout: 300_000 }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const otherUser = await createUser();
	const room = await createRandomRoom(user);
	await createDM(user, otherUser.username);

	await loginWithDeepLink(fixtures, user);
	await openRoom(fixtures, otherUser.username);
	await sendMessage(fixtures, 'Hello user');
	await backToRoomsList(fixtures);

	await openRoom(fixtures, room.name);
	await sendMessage(fixtures, 'Hello room');
	await openMessageActions(fixtures, 'Hello room');
	await screen.getByText('Forward').tap();
	await forwardMessageTo(fixtures, otherUser.username);
	await expectRoomTitle(fixtures, room.name);

	await backToRoomsList(fixtures);
	await openRoom(fixtures, otherUser.username);
	await expectVisible(fixtures, 'message-content-Hello user');
	await expectVisible(fixtures, `reply-${user.name}-Hello room`);
});
