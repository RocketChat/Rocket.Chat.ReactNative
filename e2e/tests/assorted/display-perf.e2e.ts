import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { loginWithDeepLink, LONG_TIMEOUT } from '~e2e/support/flows';
import { goToDisplayPreferences, goToRoomListFromDisplayPreferences } from '~e2e/support/settings';

afterEach(deleteCreatedUsers);

const displayPreferenceOptions = [
	'display-pref-view-expanded',
	'display-pref-view-condensed',
	'display-pref-view-avatars',
	'display-pref-view-activity',
	'display-pref-view-name',
	'display-pref-view-unread',
	'display-pref-view-favorites',
	'display-pref-view-categories'
];

test('changes the rooms list display preferences', { tags: ['test-8'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const lastMessages = screen.getByTestId('room-item-last-message-container', { visible: true });
	const avatars = screen.getByTestId('avatar', { visible: true });
	const generalRow = screen.getByTestId('rooms-list-view-item-general');

	await loginWithDeepLink(fixtures, user);
	for (const testId of ['rooms-list-view-item-general', 'rooms-list-view-create-channel', 'rooms-list-view-sidebar']) {
		await expect(screen.getByTestId(testId)).toBeVisible({ timeout: LONG_TIMEOUT });
	}

	await goToDisplayPreferences(fixtures);
	for (const testId of displayPreferenceOptions) {
		await expect(screen.getByTestId(testId)).toBeVisible({ timeout: LONG_TIMEOUT });
	}

	await screen.getByTestId('display-pref-view-expanded').tap();
	await goToRoomListFromDisplayPreferences(fixtures);
	await expect(lastMessages.first()).toBeVisible({ timeout: LONG_TIMEOUT });

	await goToDisplayPreferences(fixtures);
	await screen.getByTestId('display-pref-view-condensed').tap();
	await goToRoomListFromDisplayPreferences(fixtures);
	await expect(generalRow).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(lastMessages).toHaveCount(0, { timeout: LONG_TIMEOUT });
	await expect(avatars.first()).toBeVisible({ timeout: LONG_TIMEOUT });

	await goToDisplayPreferences(fixtures);
	await screen.getByTestId('display-pref-view-avatar-switch').tap();
	await goToRoomListFromDisplayPreferences(fixtures);
	await expect(generalRow).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(avatars).toHaveCount(0, { timeout: LONG_TIMEOUT });
});
