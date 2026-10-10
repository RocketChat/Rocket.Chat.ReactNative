import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	fillSettled,
	loginWithDeepLink,
	navigateToRoom,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenVisible,
	expectVisible,
	openRoomActions
} from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

const searchMember = async ({ screen }: Fixtures, text: string) => {
	await fillSettled(screen.getByTestId('room-members-view-search'), text);
};

const filterByStatus = async (fixtures: Fixtures, status: 'online' | 'all') => {
	await tapWhenVisible(fixtures, 'room-members-view-filter');
	await tapWhenVisible(fixtures, `room-members-view-toggle-status-${status}`);
};

test('searches members of a room', { tags: ['test-1'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const noMembersFound = screen.getByText('No members found');

	await loginWithDeepLink(fixtures, user);
	await navigateToRoom(fixtures, 'general');
	await openRoomActions(fixtures);
	await tapWhenVisible(fixtures, 'room-actions-members');
	await expectVisible(fixtures, 'room-members-view-search');

	await searchMember(fixtures, 'rohit.bansal');
	await expectVisible(fixtures, 'room-members-view-item-rohit.bansal');

	await filterByStatus(fixtures, 'online');
	await expect(noMembersFound).toBeVisible({ timeout: LONG_TIMEOUT });

	await filterByStatus(fixtures, 'all');
	await expectVisible(fixtures, 'room-members-view-item-rohit.bansal');
	await screen.getByTestId('clear-text-input').tap();

	const secondUser = await createUser();
	await searchMember(fixtures, secondUser.username);
	await expectVisible(fixtures, `room-members-view-item-${secondUser.username}`);

	await searchMember(fixtures, 'nonexistentuser12345');
	await expect(noMembersFound).toBeVisible({ timeout: LONG_TIMEOUT });
});
