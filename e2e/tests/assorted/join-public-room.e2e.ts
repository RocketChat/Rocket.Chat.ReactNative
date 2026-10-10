import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { data } from '~e2e/support/data';
import {
	backToRoomsList,
	expectAllHidden,
	expectAllVisible,
	loginWithDeepLink,
	navigateToRoom,
	navigateToRoomActions,
	searchAndNavigateRoom,
	sendMessage,
	LONG_TIMEOUT
} from '~e2e/support/flows';
import { random } from '~e2e/support/random';

afterEach(deleteCreatedUsers);

const COMMON_ROOM_ACTIONS = [
	'room-actions-view',
	'room-actions-info',
	'room-actions-members',
	'room-actions-files',
	'room-actions-mentioned',
	'room-actions-starred',
	'room-actions-share',
	'room-actions-pinned'
];

test('previews, joins and leaves a public room', { tags: ['test-3'] }, async fixtures => {
	const { screen } = fixtures;
	const room = data.channels.detoxpublic.name;
	const user = await createUser();

	await loginWithDeepLink(fixtures, user);
	await searchAndNavigateRoom(fixtures, room);

	await expectAllVisible(fixtures, ['room-view', 'room-header', 'room-view-join', 'room-view-join-button']);
	await expect(screen.getByText('You are in preview mode')).toBeVisible();
	await expect(screen.getByTestId('message-composer')).toBeHidden();

	await navigateToRoomActions(fixtures, room);
	await expectAllVisible(fixtures, COMMON_ROOM_ACTIONS);
	await expectAllHidden(fixtures, ['room-actions-notifications', 'room-actions-leave-channel']);

	await backToRoomsList(fixtures);
	await searchAndNavigateRoom(fixtures, room);
	await screen.getByTestId('room-view-join-button').tap();
	await expect(screen.getByTestId('room-view-join-button')).toBeHidden({ timeout: LONG_TIMEOUT });
	await backToRoomsList(fixtures);
	await navigateToRoom(fixtures, room);
	await expectAllVisible(fixtures, ['room-view', 'message-composer']);
	await expect(screen.getByTestId('room-view-join')).toBeHidden();

	await sendMessage(fixtures, random(5));

	await navigateToRoomActions(fixtures, room);
	await expectAllVisible(fixtures, [...COMMON_ROOM_ACTIONS, 'room-actions-notifications']);
	await screen.scrollUntilVisible(screen.getByTestId('room-actions-leave-channel'));
	await screen.getByTestId('room-actions-leave-channel').tap();
	await expect(screen.getByRole('button', { name: /^Yes/i })).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByRole('button', { name: /^Yes/i }).tap();
	await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId(`rooms-list-view-item-${room}`)).toBeHidden({ timeout: LONG_TIMEOUT });
});
