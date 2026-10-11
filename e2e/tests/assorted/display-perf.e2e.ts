import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { isVisibleNow, loginWithDeepLink, LONG_TIMEOUT, succeeds, type Fixtures } from '~e2e/support/flows';
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

const ROW_TAP_ATTEMPTS = 3;
const ROW_RESPONSE_TIMEOUT = 5_000;

const switchRow = async ({ screen }: Fixtures, testId: string, title: string, enabled: boolean) => {
	const row = screen.getByTestId(testId);
	const wanted = screen.getByLabel(`${title} ${enabled ? 'Enabled' : 'Disabled'}`);
	const current = screen.getByLabel(`${title} ${enabled ? 'Disabled' : 'Enabled'}`);
	for (let attempt = 1; attempt <= ROW_TAP_ATTEMPTS; attempt += 1) {
		if (await isVisibleNow(current)) {
			await row.tap();
		}
		if (await succeeds(expect(wanted).toBeVisible({ timeout: ROW_RESPONSE_TIMEOUT }))) {
			return;
		}
	}
	await expect(wanted).toBeVisible({ timeout: LONG_TIMEOUT });
};

test('changes the rooms list display preferences', { tags: ['test-5'] }, async fixtures => {
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

	await switchRow(fixtures, 'display-pref-view-expanded', 'Expanded', true);
	await goToRoomListFromDisplayPreferences(fixtures);
	await expect(lastMessages.first()).toBeVisible({ timeout: LONG_TIMEOUT });

	await goToDisplayPreferences(fixtures);
	await switchRow(fixtures, 'display-pref-view-condensed', 'Condensed', true);
	await goToRoomListFromDisplayPreferences(fixtures);
	await expect(generalRow).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(lastMessages).toHaveCount(0, { timeout: LONG_TIMEOUT });
	await expect(avatars.first()).toBeVisible({ timeout: LONG_TIMEOUT });

	await goToDisplayPreferences(fixtures);
	await switchRow(fixtures, 'display-pref-view-avatars', 'Avatars', false);
	await goToRoomListFromDisplayPreferences(fixtures);
	await expect(generalRow).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(avatars).toHaveCount(0, { timeout: LONG_TIMEOUT });
});
