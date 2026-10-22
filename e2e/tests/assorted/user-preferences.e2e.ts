import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	expectAllVisible,
	loginWithDeepLink,
	searchRoom,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenVisible,
	goBack
} from '~e2e/support/flows';
import { tapHeaderItem } from '~e2e/support/header';
import { goToUserPreferences } from '~e2e/support/settings';

afterEach(deleteCreatedUsers);

const convertAsciiToEmojiSwitch = ({ screen, platform }: Fixtures) =>
	platform === 'ios'
		? screen.getByRole('button', { name: 'Convert ASCII to Emoji' }).first()
		: screen.getByTestId('preferences-view-convert-ascii-to-emoji');

const ASCII_EMOJI_ROOM = 'maestro-ascii-emoji-test';

const checkPreferenceOptions = async (fixtures: Fixtures, rowTestId: string, optionTestIds: readonly string[]) => {
	await fixtures.screen.getByTestId(rowTestId).tap();
	if (fixtures.platform === 'ios') {
		await expect(fixtures.screen.getByTestId('checkmark')).toBeVisible({ timeout: LONG_TIMEOUT });
		await fixtures.screen.getByTestId('checkmark').tap();
		return;
	}
	await expectAllVisible(fixtures, optionTestIds);
	await fixtures.screen.getByTestId('action-sheet-handle').tap();
};

const notificationOptions = (preference: string, values: readonly string[]) =>
	values.map(value => `notification-preferences-${preference}-${value}`);

const openAsciiEmojiRoomFromProfile = async (fixtures: Fixtures, lastMessage: string, messageText: string) => {
	const { screen } = fixtures;
	await expect(screen.getByTestId('profile-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapHeaderItem(fixtures, 'profile-view-open-sidebar', 'Menu');
	await expect(screen.getByTestId('sidebar-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'sidebar-chats');
	await searchRoom(fixtures, ASCII_EMOJI_ROOM);
	await expect(screen.getByText(lastMessage)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId(`rooms-list-view-item-${ASCII_EMOJI_ROOM}`).tap();
	await expect(screen.getByText(messageText)).toBeVisible({ timeout: LONG_TIMEOUT });
};

test('shows notification preferences', { tags: ['test-2'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();

	await loginWithDeepLink(fixtures, user);
	await goToUserPreferences(fixtures);
	for (const testId of ['preferences-view-notifications', 'preferences-view-enable-message-parser']) {
		await expect(screen.getByTestId(testId)).toBeVisible({ timeout: LONG_TIMEOUT });
	}
	await expect(convertAsciiToEmojiSwitch(fixtures)).toBeVisible({ timeout: LONG_TIMEOUT });

	await screen.getByTestId('preferences-view-notifications').tap();
	await checkPreferenceOptions(
		fixtures,
		'user-notification-preference-view-alert',
		notificationOptions('desktopNotifications', ['default', 'all', 'mentions', 'nothing'])
	);
	await expect(screen.getByTestId('user-notification-preference-view-in-app-vibration')).toBeVisible();
	await checkPreferenceOptions(
		fixtures,
		'user-notification-preference-view-push-notification',
		notificationOptions('pushNotifications', ['default', 'all', 'mentions', 'nothing'])
	);

	await screen.getByTestId('user-notification-preference-view-troubleshooting').tap();
	await expectAllVisible(fixtures, [
		'push-troubleshoot-view-allow-push-notifications',
		'push-troubleshoot-view-push-gateway-connection',
		'push-troubleshoot-view-notification-delay'
	]);
	await goBack(fixtures);

	await checkPreferenceOptions(
		fixtures,
		'user-notification-preference-view-email-alert',
		notificationOptions('emailNotificationMode', ['mentions', 'nothing'])
	);
	await goBack(fixtures);

	if (fixtures.platform !== 'android') {
		return;
	}

	await goBack(fixtures);
	await openAsciiEmojiRoomFromProfile(fixtures, 'e2e_admin: :(', ':(');
	await expect(screen.getByText('😞')).toBeHidden({ timeout: LONG_TIMEOUT });

	await goBack(fixtures);
	await goToUserPreferences(fixtures);
	await convertAsciiToEmojiSwitch(fixtures).tap();
	await goBack(fixtures);
	await openAsciiEmojiRoomFromProfile(fixtures, 'e2e_admin: 😞', '😞');
});
