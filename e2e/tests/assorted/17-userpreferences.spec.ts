import { device, waitFor, element, by } from 'detox';

import { navigateToLogin, login, tapBack, navigateToRoom } from '../../helpers/app';
import { createRandomRoom, createRandomUser, type ITestUser, sendMessage } from '../../helpers/data_setup';

const navigateFromRoomsListViewToUserPreferencesView = async () => {
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-view')))
		.toBeVisible()
		.withTimeout(2000);
	await waitFor(element(by.id('sidebar-profile')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('sidebar-profile')).tap();
	await waitFor(element(by.id('profile-view')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('preferences-view-open')).tap();
	await waitFor(element(by.id('preferences-view')))
		.toBeVisible()
		.withTimeout(2000);
};

describe('User Preferences screen', () => {
	let room: string;
	let user: ITestUser;
	let otherUser: ITestUser;

	beforeAll(async () => {
		user = await createRandomUser();
		({ name: room } = await createRandomRoom(user));
		otherUser = await createRandomUser();
		await sendMessage(otherUser, room, ':(');
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(user.username, user.password);
		await navigateFromRoomsListViewToUserPreferencesView();
	});

	describe('Render', () => {
		it('should have notifications button', async () => {
			await waitFor(element(by.id('preferences-view-notifications')))
				.toBeVisible()
				.withTimeout(2000);
		});
		it('should have also send to channel select', async () => {
			await waitFor(element(by.id('preferences-view-enable-message-parser')))
				.toBeVisible()
				.withTimeout(2000);
		});
		it('should have convert ascii to emoji switch', async () => {
			await waitFor(element(by.id('preferences-view-convert-ascii-to-emoji')))
				.toBeVisible()
				.withTimeout(2000);
		});
	});

	describe('Usage', () => {
		describe('Convert ASCII to Emoji', () => {
			it('ASCII should not be converted to emoji', async () => {
				await tapBack();
				await waitFor(element(by.id('profile-view')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('profile-view-open-sidebar')).tap();
				await waitFor(element(by.id('sidebar-view')))
					.toBeVisible()
					.withTimeout(2000);
				await waitFor(element(by.id('sidebar-chats')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('sidebar-chats')).tap();
				await waitFor(element(by.text(`${otherUser.username}: :(`)))
					.toBeVisible()
					.withTimeout(2000);
				await navigateToRoom(room);
				await waitFor(element(by.text(':(')))
					.toBeVisible()
					.withTimeout(2000);
				await waitFor(element(by.text('😞')))
					.not.toBeVisible()
					.withTimeout(2000);
			});

			it('ASCII should be converted to emoji', async () => {
				await tapBack();
				await navigateFromRoomsListViewToUserPreferencesView();
				await waitFor(element(by.id('preferences-view-convert-ascii-to-emoji')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('preferences-view-convert-ascii-to-emoji')).tap();
				await tapBack();
				await waitFor(element(by.id('profile-view')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('profile-view-open-sidebar')).tap();
				await waitFor(element(by.id('sidebar-view')))
					.toBeVisible()
					.withTimeout(2000);
				await waitFor(element(by.id('sidebar-chats')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('sidebar-chats')).tap();
				await waitFor(element(by.text(`${otherUser.name}: 😞`)))
					.toBeVisible()
					.withTimeout(2000);
				await navigateToRoom(room);
				await waitFor(element(by.text('😞')))
					.toBeVisible()
					.withTimeout(2000);
				await waitFor(element(by.text(':(')))
					.not.toBeVisible()
					.withTimeout(2000);
			});
		});
	});
});
