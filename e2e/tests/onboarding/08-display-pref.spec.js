const {
	login, navigateToLogin
} = require('../../helpers/app');
const data = require('../../data');

const goToDisplayPref = async() => {
	await expect(element(by.id('rooms-list-view-sidebar'))).toBeVisible();
	await element(by.id('rooms-list-view-sidebar')).tap();
	await expect(element(by.id('sidebar-display'))).toBeVisible();
	await element(by.id('sidebar-display')).tap();
};
const goToRoomList = async() => {
	await expect(element(by.id('display-view-drawer'))).toBeVisible();
	await element(by.id('display-view-drawer')).tap();
	await expect(element(by.id('sidebar-chats'))).toBeVisible();
	await element(by.id('sidebar-chats')).tap();
};

describe('Rooms list screen', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
	});

	describe('Render', () => {
		it('should have rooms list screen', async() => {
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});

		it('should have room item', async() => {
			await expect(element(by.id('rooms-list-view-item-general'))).toExist();
		});

		// Render - Header
		describe('Header', () => {
			it('should have create channel button', async() => {
				await expect(element(by.id('rooms-list-view-create-channel'))).toBeVisible();
			});

			it('should have sidebar button', async() => {
				await expect(element(by.id('rooms-list-view-sidebar'))).toBeVisible();
			});
		});

		describe('DisplayPrefView', () => {
			it('should go to Display Preferences', async() => {
				await goToDisplayPref();
			});

			it('should have Displays button, expanded, condensed, avatars', async() => {
				await expect(element(by.id('expanded-display-pref'))).toBeVisible();
				await expect(element(by.id('condensed-display-pref'))).toBeVisible();
				await expect(element(by.id('avatars-display-pref'))).toBeVisible();
			});

			it('should have Sort By button', async() => {
				await expect(element(by.id('activity-display-pref'))).toBeVisible();
				await expect(element(by.id('name-display-pref'))).toBeVisible();
			});

			it('should have Group by button', async() => {
				await expect(element(by.id('unread-display-pref'))).toBeVisible();
				await expect(element(by.id('favorites-display-pref'))).toBeVisible();
				await expect(element(by.id('types-display-pref'))).toBeVisible();
			});
		});

		describe('Change display', () => {
			it('should appear the last message in RoomList when is Expanded', async() => {
				await element(by.id('expanded-display-pref')).tap();
				await goToRoomList();
				await expect(element(by.id('last-message-room-list')).atIndex(0)).toBeVisible();
			});

			it('should not appear the last message in RoomList when is Condensed', async() => {
				await goToDisplayPref();
				await element(by.id('condensed-display-pref')).tap();
				await goToRoomList();
				await expect(element(by.id('last-message-room-list'))).not.toBeVisible();
			});
		});

		describe('Change the avatar visible', () => {
			it('should have avatar as default in room list', async() => {
				await expect(element(by.id('avatar')).atIndex(0)).toExist();
			});

			it('should hide the avatar', async() => {
				await goToDisplayPref();
				await expect(element(by.id('avatar-switch'))).toBeVisible();
				await element(by.id('avatar-switch')).tap();
				await goToRoomList();
				await expect(element(by.id('avatar'))).not.toBeVisible();
			});
		});
	});
});
