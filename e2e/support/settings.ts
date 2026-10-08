import { expect } from 'e2e';

import { type Fixtures, searchAndNavigateRoom, LONG_TIMEOUT, tapUntilVisible, tapWhenVisible } from './flows';

const ACCESSIBILITY_ROOM = 'maestro-accessibility-test';

export const openSidebar = async (fixtures: Fixtures) => {
	const drawerButton = fixtures.screen.getByTestId('rooms-list-view-sidebar').first();
	await expect(drawerButton).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapUntilVisible(fixtures, drawerButton, 'sidebar-view');
};

export const openSettings = async (fixtures: Fixtures) => {
	await openSidebar(fixtures);
	await tapWhenVisible(fixtures, 'sidebar-settings');
	await expect(fixtures.screen.getByTestId('settings-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const openProfile = async (fixtures: Fixtures) => {
	await openSidebar(fixtures);
	await tapWhenVisible(fixtures, 'sidebar-profile');
	await expect(fixtures.screen.getByTestId('profile-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const goToUserPreferences = async (fixtures: Fixtures) => {
	await openProfile(fixtures);
	await tapWhenVisible(fixtures, 'preferences-view-open');
	await expect(fixtures.screen.getByTestId('preferences-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const navigateToLanguage = async (fixtures: Fixtures) => {
	await expect(fixtures.screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await openSidebar(fixtures);
	await tapWhenVisible(fixtures, 'sidebar-settings');
	await tapWhenVisible(fixtures, 'settings-view-language');
	await expect(fixtures.screen.getByTestId('language-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const enterPasscode = async ({ screen }: Fixtures, passcode: string) => {
	await expect(screen.getByTestId(`passcode-button-${passcode[0]}`)).toBeVisible({ timeout: LONG_TIMEOUT });
	for (const digit of passcode) {
		await screen.getByTestId(`passcode-button-${digit}`).tap();
	}
};

export const goToAccessibilityAndAppearance = async (fixtures: Fixtures) => {
	await openSidebar(fixtures);
	await tapWhenVisible(fixtures, 'sidebar-accessibility');
	await expect(fixtures.screen.getByTestId('accessibility-view-list')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const toggleAccessibilitySwitchAndOpenRoom = async (fixtures: Fixtures, switchTestId: string) => {
	await tapWhenVisible(fixtures, switchTestId);
	await tapWhenVisible(fixtures, 'accessibility-view-drawer');
	await tapWhenVisible(fixtures, 'sidebar-chats');
	await expect(fixtures.screen.getByTestId('sidebar-view')).toBeHidden({ timeout: LONG_TIMEOUT });
	await searchAndNavigateRoom(fixtures, ACCESSIBILITY_ROOM);
};

export const goToDisplayPreferences = async (fixtures: Fixtures) => {
	await openSidebar(fixtures);
	await tapWhenVisible(fixtures, 'sidebar-accessibility');
	await tapWhenVisible(fixtures, 'accessibility-display-button');
};

export const goToRoomListFromDisplayPreferences = async (fixtures: Fixtures) => {
	await tapWhenVisible(fixtures, 'custom-header-back');
	await tapWhenVisible(fixtures, 'accessibility-view-drawer');
	await tapWhenVisible(fixtures, 'sidebar-chats');
	await expect(fixtures.screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};
