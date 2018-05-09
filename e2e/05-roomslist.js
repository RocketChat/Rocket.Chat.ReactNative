const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { login } = require('./helpers/app');
const data = require('./data');

describe('Rooms list screen', () => {
	before(async() => {
        // await device.launchApp({ delete: true, permissions: { notifications: 'YES' } });
        await login();
        await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
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
			it('should have header', async() => {
				await expect(element(by.id('rooms-list-view-header'))).toBeVisible();
			});
	
			it('should have create channel button', async() => {
				await expect(element(by.id('rooms-list-view-create-channel'))).toBeVisible();
			});
	
			it('should have user', async() => {
				await expect(element(by.id('rooms-list-view-user'))).toBeVisible();
			});
	
			it('should have sidebar button', async() => {
				await expect(element(by.id('rooms-list-view-sidebar'))).toBeVisible();
			});
		});

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', async() => {
		beforeEach(async() => {
			await device.reloadReactNative();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
		});

		// Usage - Header
		describe('Header', async() => {
			it('should navigate to create channel', async() => {
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('select-users-view'))).toBeVisible();
			});
			
			it('should show user presence modal', async() => {
				await element(by.id('rooms-list-view-user')).tap();
				await waitFor(element(by.id('rooms-list-view-user-presence-modal'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('rooms-list-view-user-presence-modal'))).toBeVisible();
			});
	
			it('should show sidebar', async() => {
				await element(by.id('rooms-list-view-sidebar')).tap();
				await waitFor(element(by.id('sidebar'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('sidebar'))).toBeVisible();
			});
		});

		// Usage - Sidebar
		describe('Sidebar', async() => {
			it('should navigate to add server', async() => {
				await element(by.id('rooms-list-view-sidebar')).tap();
				await waitFor(element(by.id('sidebar'))).toBeVisible().withTimeout(2000);
				await element(by.id('sidebar-add-server')).tap();
				await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('new-server-view'))).toBeVisible();
			});
	
			it('should logout', async() => {
				await element(by.id('rooms-list-view-sidebar')).tap();
				await waitFor(element(by.id('sidebar'))).toBeVisible().withTimeout(2000);
				await element(by.id('sidebar-logout')).tap();
				await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('welcome-view'))).toBeVisible();
			});
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});
});
