const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { login, navigateToLogin } = require('./helpers/app');
const data = require('./data');

// 56s
describe('Rooms list screen', () => {
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
		it('should show user presence modal', async() => {
			await element(by.id('rooms-list-view-user')).tap();
			await waitFor(element(by.id('rooms-list-view-user-presence-modal'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('rooms-list-view-user-presence-modal'))).toBeVisible();
			await element(by.id('rooms-list-view-user-presence-online')).tap();
			await waitFor(element(by.id('rooms-list-view-user-presence-modal'))).toBeNotVisible().withTimeout(5000);
			await expect(element(by.id('rooms-list-view-user-presence-modal'))).toBeNotVisible();
		});

		it('should search room and navigate', async() => {
			await element(by.id('rooms-list-view-list')).swipe('down');
			await waitFor(element(by.id('rooms-list-view-search'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('rooms-list-view-search'))).toBeVisible();
			await element(by.id('rooms-list-view-search')).replaceText('rocket.cat');
			await waitFor(element(by.id('rooms-list-view-item-rocket.cat'))).toBeVisible().withTimeout(10000);
			await expect(element(by.id('rooms-list-view-item-rocket.cat'))).toBeVisible();
			await element(by.id('rooms-list-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
			await expect(element(by.id('room-view'))).toBeVisible();
			await element(by.id('header-back')).atIndex(0).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});

		// Usage - Sidebar
		describe('Sidebar', async() => {
			it('should navigate to add server', async() => {
				await element(by.id('rooms-list-view-sidebar')).tap();
				await waitFor(element(by.id('sidebar'))).toBeVisible().withTimeout(2000);
				await element(by.id('sidebar-add-server')).tap();
				await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('new-server-view'))).toBeVisible();
				await element(by.id('header-back')).atIndex(0).tap();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('rooms-list-view'))).toBeVisible();
			});
	
			it('should logout', async() => {
				await element(by.id('rooms-list-view-sidebar')).tap();
				await waitFor(element(by.id('sidebar'))).toBeVisible().withTimeout(2000);
				await element(by.id('sidebar-logout')).tap();
				await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(5000);
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
