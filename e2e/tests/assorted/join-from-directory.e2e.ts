import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomTeam, createUser, deleteCreatedUsers, sendMessage } from '~e2e/support/api';
import {
	loginWithDeepLink,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenVisible,
	fillWhenUncovered,
	goBack,
	headerSearchInput
} from '~e2e/support/flows';
import { expectRoomTitle, selectHeaderMenuOption, tapHeaderItem, threadsButton } from '~e2e/support/header';
import { random } from '~e2e/support/random';

afterEach(deleteCreatedUsers);

const CHANNEL = 'join-from-directory';

const openDirectory = async (fixtures: Fixtures) => {
	await tapHeaderItem(fixtures, 'rooms-list-view-directory', 'Directory');
	await expect(fixtures.screen.getByTestId('directory-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

const filterDirectory = async (fixtures: Fixtures, type: 'users' | 'teams') => {
	await selectHeaderMenuOption(
		fixtures,
		{ testId: 'directory-view-filter', iosLabel: 'Filter' },
		{ testId: `directory-switch-${type}`, iosLabel: type === 'users' ? 'Users' : 'Teams' }
	);
};

const searchAndOpen = async (fixtures: Fixtures, name: string) => {
	const { screen } = fixtures;
	const search = headerSearchInput(fixtures, 'directory-view-search');
	await tapWhenVisible(fixtures, search);
	await fillWhenUncovered(search, name);
	const resultItem = screen.getByTestId(`directory-view-item-${name}`).first();
	await expect(resultItem).toBeVisible({ timeout: LONG_TIMEOUT });
	await resultItem.tap();
	await expect(screen.getByTestId('room-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expectRoomTitle(fixtures, name);
};

test('joins a channel, user and team from the directory', { tags: ['test-7'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const otherUser = await createUser();
	const team = await createRandomTeam(user);
	const thread = `${random()}thread`;
	const threadStart = await sendMessage(user, CHANNEL, thread);
	await sendMessage(user, threadStart.message.rid, 'insidethread', threadStart.message._id);

	await loginWithDeepLink(fixtures, user);

	await openDirectory(fixtures);
	await searchAndOpen(fixtures, CHANNEL);

	await tapWhenVisible(fixtures, threadsButton(fixtures));
	await expect(screen.getByTestId(`thread-messages-view-${thread}`)).toBeVisible({ timeout: LONG_TIMEOUT });
	await goBack(fixtures);
	await expect(threadsButton(fixtures)).toBeVisible({ timeout: LONG_TIMEOUT });

	await goBack(fixtures);
	await openDirectory(fixtures);
	await filterDirectory(fixtures, 'users');
	await searchAndOpen(fixtures, otherUser.username);

	await goBack(fixtures);
	await openDirectory(fixtures);
	await filterDirectory(fixtures, 'teams');
	await searchAndOpen(fixtures, team);
});
