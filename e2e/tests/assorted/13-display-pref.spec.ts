import { device, waitFor, element, by, expect } from 'detox';

import { login, navigateToLogin } from '../../helpers/app';
import { createRandomUser } from '../../helpers/data_setup';

const goToDisplayPref = async () => {
	await expect(element(by.id('rooms-list-view-sidebar'))).toBeVisible();
	await element(by.id('rooms-list-view-sidebar')).tap();
	await expect(element(by.id('sidebar-display'))).toBeVisible();
	await element(by.id('sidebar-display')).tap();
};
const goToRoomList = async () => {
	await expect(element(by.id('display-view-drawer'))).toBeVisible();
	await element(by.id('display-view-drawer')).tap();
	await expect(element(by.id('sidebar-chats'))).toBeVisible();
	await element(by.id('sidebar-chats')).tap();
};

describe('Display prefs', () => {
	beforeAll(async () => {
		const user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
		await navigateToLogin();
		await login(user.username, user.password);
	});

	describe('Render', () => {
		it('should have rooms list screen', async () => {
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});

		it('should have room item', async () => {
			await waitFor(element(by.id('rooms-list-view-item-general')))
				.toExist()
				.withTimeout(2000);
		});

		// Render - Header
		describe('Header', () => {
			it('should have create channel button', async () => {
				await expect(element(by.id('rooms-list-view-create-channel'))).toBeVisible();
			});

			it('should have sidebar button', async () => {
				await expect(element(by.id('rooms-list-view-sidebar'))).toBeVisible();
			});
		});

		describe('DisplayPrefView', () => {
			it('should go to Display Preferences', async () => {
				await goToDisplayPref();
			});

			it('should have Displays button, expanded, condensed, avatars', async () => {
				await expect(element(by.id('display-pref-view-expanded'))).toBeVisible();
				await expect(element(by.id('display-pref-view-condensed'))).toBeVisible();
				await expect(element(by.id('display-pref-view-avatars'))).toBeVisible();
			});

			it('should have Sort By button', async () => {
				await expect(element(by.id('display-pref-view-activity'))).toBeVisible();
				await expect(element(by.id('display-pref-view-name'))).toBeVisible();
			});

			it('should have Group by button', async () => {
				await expect(element(by.id('display-pref-view-unread'))).toBeVisible();
				await expect(element(by.id('display-pref-view-favorites'))).toBeVisible();
				await expect(element(by.id('display-pref-view-types'))).toBeVisible();
			});
		});

		describe('Change display', () => {
			it('should appear the last message in RoomList when is Expanded', async () => {
				await element(by.id('display-pref-view-expanded')).tap();
				await goToRoomList();
				await expect(element(by.id('room-item-last-message-container')).atIndex(0)).toBeVisible();
			});

			it('should not appear the last message in RoomList when is Condensed', async () => {
				await goToDisplayPref();
				await element(by.id('display-pref-view-condensed')).tap();
				await goToRoomList();
				await expect(element(by.id('room-item-last-message-container'))).not.toBeVisible();
			});
		});

		describe('Change the avatar visible', () => {
			it('should have avatar as default in room list', async () => {
				await expect(element(by.id('avatar')).atIndex(0)).toExist();
			});

			it('should hide the avatar', async () => {
				await goToDisplayPref();
				await expect(element(by.id('display-pref-view-avatar-switch'))).toBeVisible();
				await element(by.id('display-pref-view-avatar-switch')).tap();
				await goToRoomList();
				await waitFor(element(by.id('avatar').withAncestor(by.id('rooms-list-view-item-general'))))
					.not.toBeVisible()
					.withTimeout(2000);
			});
		});
	});
});
