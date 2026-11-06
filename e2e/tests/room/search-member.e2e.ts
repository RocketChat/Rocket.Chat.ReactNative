import { afterEach, test } from '~e2e/support/fixtures';
import { expect } from 'e2e';

import { openRoomScreen } from '~e2e/support/appduct';
import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	fillSettled,
	loginWithDeepLink,
	type Fixtures,
	LONG_TIMEOUT,
	expectVisible,
	headerSearchInput
} from '~e2e/support/flows';
import { selectHeaderMenuOption } from '~e2e/support/header';

afterEach(deleteCreatedUsers);

const searchMember = async (fixtures: Fixtures, text: string) => {
	await fillSettled(headerSearchInput(fixtures, 'room-members-view-search'), text);
};

const filterByStatus = async (fixtures: Fixtures, status: 'online' | 'all') => {
	await selectHeaderMenuOption(
		fixtures,
		{ testId: 'room-members-view-filter', iosLabel: 'Filter' },
		{
			testId: `room-members-view-toggle-status-${status}`,
			iosLabel: status === 'all' ? 'All' : 'Online'
		}
	);
};

test('searches members of a room', { tags: ['test-5'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const noMembersFound = screen.getByText('No members found');

	await loginWithDeepLink(fixtures, user);
	await openRoomScreen(fixtures, 'RoomMembersView', 'general');
	await expect(headerSearchInput(fixtures, 'room-members-view-search')).toBeVisible({ timeout: LONG_TIMEOUT });

	await searchMember(fixtures, 'rohit.bansal');
	await expectVisible(fixtures, 'room-members-view-item-rohit.bansal');

	await filterByStatus(fixtures, 'online');
	await expect(noMembersFound).toBeVisible({ timeout: LONG_TIMEOUT });

	await filterByStatus(fixtures, 'all');
	await expectVisible(fixtures, 'room-members-view-item-rohit.bansal');
	await (
		fixtures.platform === 'ios' ? screen.getByRole('button', { name: 'Clear text' }) : screen.getByTestId('clear-text-input')
	).tap();

	const secondUser = await createUser();
	await searchMember(fixtures, secondUser.username);
	await expectVisible(fixtures, `room-members-view-item-${secondUser.username}`);

	await searchMember(fixtures, 'nonexistentuser12345');
	await expect(noMembersFound).toBeVisible({ timeout: LONG_TIMEOUT });
});
