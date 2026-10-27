import { expect } from 'e2e';

import { expectVisible, LONG_TIMEOUT, type Fixtures } from './flows';
import { expectRoomTitle } from './header';

const SCREEN_TEST_IDS = {
	SettingsView: 'settings-view',
	LanguageView: 'language-view',
	SecurityPrivacyView: 'security-privacy-view',
	MediaAutoDownloadView: 'media-auto-download-image',
	AccessibilityAndAppearanceView: 'accessibility-view-list',
	DisplayPrefsView: 'display-view-list',
	ThemeView: 'theme-view',
	ProfileView: 'profile-view',
	UserPreferencesView: 'preferences-view',
	UserNotificationPrefView: 'user-notification-preference-view',
	DirectoryView: 'directory-view'
} as const;

const ROOM_SCREEN_TEST_IDS = {
	RoomActionsView: 'room-actions-view',
	RoomInfoView: 'room-info-view',
	RoomMembersView: 'room-members-view',
	NotificationPrefView: 'notification-preference-view',
	ThreadMessagesView: 'thread-messages-view'
} as const;

type OpenedRoom = { rid: string };

export const openRoom = async (fixtures: Fixtures, room: string) => {
	const { rid } = (await fixtures.appduct.call('open_room', { name: room })) as OpenedRoom;
	await expectRoomTitle(fixtures, room);
	return rid;
};

const waitForDrawerClosed = ({ screen }: Fixtures) =>
	expect(screen.getByRole('button', 'Close drawer')).toBeHidden({ timeout: LONG_TIMEOUT });

export const openScreen = async (fixtures: Fixtures, screen: keyof typeof SCREEN_TEST_IDS) => {
	await waitForDrawerClosed(fixtures);
	await fixtures.appduct.call('navigate', { screen });
	await expectVisible(fixtures, SCREEN_TEST_IDS[screen]);
};

export const openRoomScreen = async (fixtures: Fixtures, screen: keyof typeof ROOM_SCREEN_TEST_IDS, room: string) => {
	const rid = await openRoom(fixtures, room);
	await fixtures.appduct.call('navigate', { screen, rid });
	await expectVisible(fixtures, ROOM_SCREEN_TEST_IDS[screen]);
};
