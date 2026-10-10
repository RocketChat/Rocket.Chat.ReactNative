import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import { loginWithDeepLink, type Fixtures, LONG_TIMEOUT } from '~e2e/support/flows';
import { navigateToLanguage, openSidebar } from '~e2e/support/settings';

afterEach(deleteCreatedUsers);

const selectLanguage = async (fixtures: Fixtures, language: string) => {
	await navigateToLanguage(fixtures);
	await fixtures.screen.getByTestId(`language-view-${language}`).tap();
	await expect(fixtures.screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

const expectSidebarLabels = async (fixtures: Fixtures, labels: string[]) => {
	const { screen } = fixtures;
	await openSidebar(fixtures);
	for (const label of labels) {
		await expect(screen.getByText(label).first()).toBeVisible({ timeout: LONG_TIMEOUT });
	}
	await screen.getByTestId('sidebar-close-drawer').tap();
};

test('translates the app and falls back to English', { tags: ['test-3'] }, async fixtures => {
	const user = await createUser();
	await createRandomRoom(user);

	await loginWithDeepLink(fixtures, user);

	await selectLanguage(fixtures, 'en');
	await expectSidebarLabels(fixtures, ['Chats', 'Profile', 'Settings']);

	await selectLanguage(fixtures, 'nl');
	await expectSidebarLabels(fixtures, ['Chats', 'Profiel', 'Instellingen']);
});
