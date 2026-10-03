import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	expectAllVisible,
	goBack,
	loginWithDeepLink,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenUncovered,
	tapWhenVisible
} from '~e2e/support/flows';
import { openSettings } from '~e2e/support/settings';

afterEach(deleteCreatedUsers);

const MEDIA_TYPES = ['image', 'video', 'audio'] as const;

const checkMediaAutoDownloadOptions = async (fixtures: Fixtures, mediaType: (typeof MEDIA_TYPES)[number]) => {
	const prefix = `media-auto-download-${mediaType}`;
	await tapWhenUncovered(fixtures.screen.getByTestId(prefix));
	await expectAllVisible(fixtures, [`${prefix}-wifi_mobile_data`, `${prefix}-wifi`, `${prefix}-never`]);
	await fixtures.screen.getByTestId('action-sheet-handle').tap();
};

test('shows settings, clears cache and opens legal', { tags: ['test-8'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const room = await createRandomRoom(user);
	const settingsView = screen.getByTestId('settings-view');

	await loginWithDeepLink(fixtures, user);
	await openSettings(fixtures);
	await expectAllVisible(fixtures, [
		'settings-view-language',
		'settings-view-review-app',
		'settings-view-share-app',
		'settings-view-default-browser',
		'settings-view-security-privacy',
		'settings-view-media-auto-download'
	]);

	await screen.getByTestId('settings-view-media-auto-download').tap();
	await expect(screen.getByTestId('media-auto-download-image')).toBeVisible({ timeout: LONG_TIMEOUT });
	for (const mediaType of MEDIA_TYPES) {
		await checkMediaAutoDownloadOptions(fixtures, mediaType);
	}
	await goBack(fixtures);
	await expect(settingsView).toBeVisible({ timeout: LONG_TIMEOUT });

	await expectAllVisible(fixtures, [
		'settings-view-license',
		'settings-view-legal',
		'settings-view-version',
		'settings-view-server-version',
		'settings-view-get-help'
	]);
	await screen.getByTestId('settings-view-get-help').tap();
	await expect(screen.getByTestId('settings-view-get-help-documentation')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expectAllVisible(fixtures, ['settings-view-get-help-accessibility-statement', 'settings-view-get-help-glossary']);
	await goBack(fixtures);

	await expect(settingsView).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'settings-view-clear-cache');
	await expect(screen.getByText(/This will clear all your offline data/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByRole('button', { name: /^Clear$/i }).tap();
	await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId(`rooms-list-view-item-${room.name}`)).toBeVisible({ timeout: LONG_TIMEOUT });

	await openSettings(fixtures);
	await tapWhenVisible(fixtures, 'settings-view-legal');
	await expect(screen.getByTestId('legal-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expectAllVisible(fixtures, ['legal-terms-button', 'legal-privacy-button']);
});
