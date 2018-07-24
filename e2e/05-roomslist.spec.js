const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { login, navigateToLogin, tapBack } = require('./helpers/app');
const data = require('./data');

describe('Rooms list screen', () => {
	before(async() => {
		await device.reloadReactNative(); // TODO: remove this after fix logout subscription
	});

	describe('Render', async() => {
		it('should have rooms list screen', async() => {
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
        });
        
        it('should have rooms list', async() => {
			await expect(element(by.id('rooms-list-view-list'))).toBeVisible();
		});

        it('should have room item', async() => {
			await expect(element(by.id('rooms-list-view-item-general'))).toExist();
		});
		
		// Render - Header
		describe('Header', async() => {
			it('should have create channel button', async() => {
				await expect(element(by.id('rooms-list-view-create-channel'))).toBeVisible();
			});
	
			it('should have sidebar button', async() => {
				await expect(element(by.id('rooms-list-view-sidebar'))).toBeVisible();
				// await expect(element(by.id('rooms-list-view-sidebar'))).toHaveLabel(`Connected to ${ data.server }. Tap to view servers list.`);
			});
		});

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', async() => {
		it('should search room and navigate', async() => {
			await element(by.id('rooms-list-view-list')).swipe('down');
			await waitFor(element(by.id('rooms-list-view-search'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('rooms-list-view-search'))).toBeVisible();
			await element(by.id('rooms-list-view-search')).replaceText('rocket.cat');
			await waitFor(element(by.id('rooms-list-view-item-rocket.cat'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('rooms-list-view-item-rocket.cat'))).toBeVisible();
			await element(by.id('rooms-list-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(10000);
			await expect(element(by.id('room-view'))).toBeVisible();
			await waitFor(element(by.text('rocket.cat'))).toBeVisible().withTimeout(60000);
			await expect(element(by.text('rocket.cat'))).toBeVisible();
			await tapBack('Messages');
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
			await element(by.id('rooms-list-view-search')).replaceText('');
			await waitFor(element(by.id('rooms-list-view-item-rocket.cat'))).toExist().withTimeout(60000);
			await expect(element(by.id('rooms-list-view-item-rocket.cat'))).toExist();
		});

		// Usage - Sidebar
		describe('Sidebar', async() => {
			it('should navigate to add server', async() => {
				await element(by.id('rooms-list-view-sidebar')).tap();
				await waitFor(element(by.id('sidebar'))).toBeVisible().withTimeout(2000);
				await element(by.id('sidebar-toggle-server')).tap();
				await waitFor(element(by.id('sidebar-add-server'))).toBeVisible().withTimeout(2000);
				await element(by.id('sidebar-add-server')).tap();
				await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('new-server-view'))).toBeVisible();
				await tapBack('Messages');
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('rooms-list-view'))).toBeVisible();
			});
	
			it('should logout', async() => {
				await element(by.id('rooms-list-view-sidebar')).tap();
				await waitFor(element(by.id('sidebar'))).toBeVisible().withTimeout(2000);
				await waitFor(element(by.id('sidebar-logout'))).toBeVisible().withTimeout(2000);
				await element(by.id('sidebar-logout')).tap();
				await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('welcome-view'))).toBeVisible();
				await navigateToLogin();
				await login();
			});
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});
});
