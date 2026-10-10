import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { loginWithDeepLink, type Fixtures, LONG_TIMEOUT, tapWhenVisible } from '~e2e/support/flows';
import { enterPasscode, openSettings } from '~e2e/support/settings';
import { delay } from '~e2e/support/timing';

afterEach(deleteCreatedUsers);

const FIRST_PASSCODE = '123456';
const SECOND_PASSCODE = '345678';
const AUTO_LOCK_WAIT = 7000;

const openScreenLockSettings = async (fixtures: Fixtures) => {
	await openSettings(fixtures);
	await tapWhenVisible(fixtures, 'settings-view-security-privacy');
	await tapWhenVisible(fixtures, 'security-privacy-view-screen-lock');
};

const chooseNewPasscode = async (fixtures: Fixtures, passcode: string) => {
	await expect(fixtures.screen.getByText('Choose your new passcode')).toBeVisible({ timeout: LONG_TIMEOUT });
	await enterPasscode(fixtures, passcode);
	await expect(fixtures.screen.getByText('Confirm your new passcode')).toBeVisible({ timeout: LONG_TIMEOUT });
	await enterPasscode(fixtures, passcode);
};

const relaunchAfterAutoLock = async ({ device, app }: Fixtures) => {
	await device.home();
	await delay(AUTO_LOCK_WAIT);
	await device.closeApp();
	await app.open();
};

test('locks the app with a passcode and changes it', { tags: ['test-3'], timeout: 300_000 }, async fixtures => {
	const { screen } = fixtures;
	const screenLockConfig = screen.getByTestId('screen-lock-config-view');
	const user = await createUser();

	await loginWithDeepLink(fixtures, user);
	await openScreenLockSettings(fixtures);
	await expect(screenLockConfig).toBeVisible({ timeout: LONG_TIMEOUT });

	await screen.getByTestId('screen-lock-config-view-auto-lock').tap();
	await chooseNewPasscode(fixtures, FIRST_PASSCODE);
	await tapWhenVisible(fixtures, 'screen-lock-config-view-auto-lock-time-60');

	await relaunchAfterAutoLock(fixtures);
	await enterPasscode(fixtures, FIRST_PASSCODE);
	await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });

	await openScreenLockSettings(fixtures);
	await enterPasscode(fixtures, FIRST_PASSCODE);
	await expect(screenLockConfig).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'screen-lock-config-view-change-passcode');
	await enterPasscode(fixtures, FIRST_PASSCODE);
	await chooseNewPasscode(fixtures, SECOND_PASSCODE);
	await expect(screenLockConfig).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId('screen-lock-config-view-change-passcode')).toBeVisible();

	await relaunchAfterAutoLock(fixtures);
	await enterPasscode(fixtures, SECOND_PASSCODE);
	await expect(screen.getByTestId('passcode-button-3')).toBeHidden({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
});
