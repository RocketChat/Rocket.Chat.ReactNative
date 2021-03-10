const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { navigateToLogin, login, mockMessage, tapBack, searchRoom, logout } = require('../../helpers/app');

async function navigateToRoom(user) {
	await searchRoom(`${ user }`);
	await waitFor(element(by.id(`rooms-list-view-item-${ user }`))).toExist().withTimeout(60000);
	await element(by.id(`rooms-list-view-item-${ user }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
}


describe('Mark as unread', () => {
	const user = data.users.alternate.username

	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
		await navigateToRoom(user);
	});

	describe('Render', async() => {
		it('should have room screen', async() => {
			await expect(element(by.id('room-view'))).toExist();
			await waitFor(element(by.id(`room-view-title-${ user }`))).toExist().withTimeout(5000);
		});

		// Render - Header
		describe('Header', async() => {
			it('should have actions button ', async() => {
				await expect(element(by.id('room-view-header-actions'))).toExist();
			});

			it('should have threads button ', async() => {
				await expect(element(by.id('room-view-header-threads'))).toExist();
			});
		});

		// Render - Messagebox
		describe('Messagebox', async() => {
			it('should have messagebox', async() => {
				await expect(element(by.id('messagebox'))).toExist();
			});

			it('should have open emoji button', async() => {
				if (device.getPlatform() === 'android') {
					await expect(element(by.id('messagebox-open-emoji'))).toExist();
				}
			});

			it('should have message input', async() => {
				await expect(element(by.id('messagebox-input'))).toExist();
			});

			it('should have audio button', async() => {
				await expect(element(by.id('messagebox-send-audio'))).toExist();
			});

			it('should have actions button', async() => {
				await expect(element(by.id('messagebox-actions'))).toExist();
			});
		});
	});

	describe('Usage', async() => {
		describe('Mark message as unread', async() => {
			it('should mark message as unread', async() => {
				await mockMessage('message')
				await expect(element(by.label(`${ data.random }message`)).atIndex(0)).toExist();
				await tapBack();
				await logout();
				await navigateToLogin();
				await login(data.users.alternate.username, data.users.alternate.password);
				await navigateToRoom(data.users.regular.username);
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Mark Unread')).tap();
				await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(5000);
				await expect(element(by.id(`rooms-list-view-item-${data.users.regular.username}`))).toExist();
			});
	
		});
	});
});
