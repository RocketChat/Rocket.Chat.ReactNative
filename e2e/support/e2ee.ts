import { expect } from 'e2e';

import type { Credentials } from './api';
import { data } from './data';
import {
	firstVisible,
	type Fixtures,
	hideKeyboard,
	launchApp,
	loginWithForm,
	navigateToLogin,
	navigateToRoom,
	LONG_TIMEOUT,
	openMessageActions,
	tapUntilVisible,
	tapWhenVisible
} from './flows';
import { createAndOpenChannel } from './teams';

const tapTextWhenVisible = (fixtures: Fixtures, text: string | RegExp) =>
	tapWhenVisible(fixtures, fixtures.screen.getByText(text));

export const expectMessages = async ({ screen }: Fixtures, messages: readonly string[]) => {
	for (const message of messages) {
		await expect(screen.getByText(new RegExp(`\\b${message}\\b`)).first()).toBeVisible({ timeout: LONG_TIMEOUT });
	}
};

const openSecurityAndPrivacy = async (fixtures: Fixtures) => {
	const menuItem = fixtures.screen.getByTestId('settings-view-security-privacy', { visible: true });
	await expect(menuItem).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapUntilVisible(fixtures, menuItem, 'security-privacy-view');
};

export const navigateToE2EESecurity = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'rooms-list-view-sidebar');
	await expect(screen.getByTestId('sidebar-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'sidebar-settings');
	await openSecurityAndPrivacy(fixtures);
	await tapWhenVisible(fixtures, 'security-privacy-view-e2e-encryption');
	await expect(screen.getByTestId('e2e-encryption-security-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const changeE2EEPassword = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	await tapTextWhenVisible(fixtures, 'Enter manually');
	await screen.getByPlaceholder('New password').fill(data.e2eePassword);
	await hideKeyboard(fixtures);
	const save = screen.getByText(/^Save changes$/i);
	await screen.scrollUntilVisible(save, { timeout: LONG_TIMEOUT });
	await save.tap();
	await expect(screen.getByText(/Are you sure/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByText(/Make sure you've saved it carefully somewhere else/)).toBeVisible({
		timeout: LONG_TIMEOUT
	});
	await screen
		.getByRole('button', { name: /^Yes, change it$/i })
		.last()
		.tap();
	await expect(screen.getByText('E2E key password changed successfully!')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const resetE2EEKey = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	const reset = screen.getByTestId('e2e-encryption-security-view-reset-key');
	await screen.scrollUntilVisible(reset);
	await reset.tap();
	await expect(screen.getByText(/Are you sure/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByText(/You're going to be logged out/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen
		.getByRole('button', { name: /^Yes, reset it$/i })
		.last()
		.tap();
	await expect(screen.getByTestId('new-server-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

const enterE2EEPassword = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	await expect(screen.getByText(/is encrypted/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByText(/Enter your end-to-end encryption password to access/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapTextWhenVisible(fixtures, 'Enter E2EE password');
	await tapWhenVisible(fixtures, 'e2e-enter-your-password-view-password');
	await screen.getByTestId('e2e-enter-your-password-view-password').fill(data.e2eePassword);
	await tapTextWhenVisible(fixtures, 'Enable encryption');
	await expect(screen.getByTestId('room-view-messages')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const setupE2EEUser = async (fixtures: Fixtures, user: Credentials) => {
	await launchApp(fixtures);
	await navigateToLogin(fixtures);
	await loginWithForm(fixtures, user);
	await navigateToE2EESecurity(fixtures);
	await changeE2EEPassword(fixtures);
};

export const createE2EERoom = async (fixtures: Fixtures, room: string, member: string) => {
	await fixtures.app.restart();
	await createAndOpenChannel(fixtures, room, { encrypted: true, members: [member] });
};

export const openRoomFromList = async (fixtures: Fixtures, room: string) => {
	const { screen } = fixtures;
	const savePasswordBanner = screen.getByTestId('e2e-save-your-password-view-close');
	const roomRow = screen.getByTestId(`rooms-list-view-item-${room}`);
	if ((await firstVisible([savePasswordBanner, roomRow])) === savePasswordBanner) {
		await savePasswordBanner.tap();
	}
	await navigateToRoom(fixtures, room);
};

export const openEncryptedRoom = async (fixtures: Fixtures, room: string) => {
	await openRoomFromList(fixtures, room);
	await enterE2EEPassword(fixtures);
};

export const expectLastMessageUnread = async ({ screen, platform }: Fixtures) => {
	const unread = platform === 'android' ? screen.getByTestId('read-receipt-unread') : screen.getByLabel(/Message was not read/);
	await expect(unread.first()).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const quoteMessage = async (fixtures: Fixtures, message: string, quote: string) => {
	const { screen } = fixtures;
	await openMessageActions(fixtures, message);
	await expect(screen.getByTestId('action-sheet-handle')).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapTextWhenVisible(fixtures, 'Quote');
	await tapWhenVisible(fixtures, 'message-composer-input');
	await screen.getByTestId('message-composer-input').fill(quote);
	await tapWhenVisible(fixtures, 'message-composer-send');
	await expect(screen.getByText(new RegExp(quote)).first()).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const editMessage = async (fixtures: Fixtures, message: string, edited: string) => {
	const { screen } = fixtures;
	await openMessageActions(fixtures, message);
	await tapTextWhenVisible(fixtures, 'Edit');
	await screen.getByTestId('message-composer-input').fill(edited);
	await screen.getByTestId('message-composer-send').tap();
};

export const resetRoomKey = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	await expect(screen.getByText(/Check back in a few moments/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByText(/The encryption keys for the room need to be updated/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'room-view-header-encryption');
	await expect(screen.getByTestId('e2ee-toggle-room-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'e2ee-toggle-room-reset-key');
	await expect(screen.getByText(/Reset encryption key/).first()).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen
		.getByRole('button', { name: /^Reset$/i })
		.last()
		.tap();
};
