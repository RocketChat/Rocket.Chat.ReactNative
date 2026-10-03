import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomTeam, createUser, deleteCreatedUsers, sendMessage } from '~e2e/support/api';
import { loginWithDeepLink, type Fixtures, LONG_TIMEOUT, tapWhenVisible } from '~e2e/support/flows';
import { random } from '~e2e/support/random';

afterEach(deleteCreatedUsers);

const CHANNEL = 'join-from-directory';

const openDirectory = async (fixtures: Fixtures) => {
	await tapWhenVisible(fixtures, 'rooms-list-view-directory');
	await expect(fixtures.screen.getByTestId('directory-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

const filterDirectory = async (fixtures: Fixtures, type: 'users' | 'teams') => {
	await tapWhenVisible(fixtures, 'directory-view-filter');
	await tapWhenVisible(fixtures, `directory-switch-${type}`);
};

const searchAndOpen = async (fixtures: Fixtures, name: string) => {
	const { screen } = fixtures;
	await tapWhenVisible(fixtures, 'directory-view-search');
	await screen.getByTestId('directory-view-search').fill(name);
	const resultItem = screen.getByTestId(`directory-view-item-${name}`).first();
	await expect(resultItem).toBeVisible({ timeout: LONG_TIMEOUT });
	await resultItem.tap();
	await expect(screen.getByTestId('room-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId(`room-view-title-${name}`)).toBeVisible({ timeout: LONG_TIMEOUT });
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

	await tapWhenVisible(fixtures, 'room-view-header-threads');
	await expect(screen.getByTestId(`thread-messages-view-${thread}`)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('custom-header-back').tap();
	await expect(screen.getByTestId('room-view-header-threads')).toBeVisible({ timeout: LONG_TIMEOUT });

	await screen.getByTestId('header-back').tap();
	await openDirectory(fixtures);
	await filterDirectory(fixtures, 'users');
	await searchAndOpen(fixtures, otherUser.username);

	await screen.getByTestId('header-back').tap();
	await openDirectory(fixtures);
	await filterDirectory(fixtures, 'teams');
	await searchAndOpen(fixtures, team);
});
