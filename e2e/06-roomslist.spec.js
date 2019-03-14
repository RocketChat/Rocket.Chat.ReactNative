const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { login, navigateToLogin, tapBack, sleep } = require('./helpers/app');
const data = require('./data');

describe('Rooms list screen', () => {
	describe('Render', async() => {
		it('should have rooms list screen', async() => {
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
        });
        
        // it('should have rooms list', async() => {
		// 	await expect(element(by.id('rooms-list-view-list'))).toBeVisible();
		// });

        it('should have room item', async() => {
			await expect(element(by.id('rooms-list-view-item-general')).atIndex(0)).toExist();
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
			// await element(by.id('rooms-list-view-list')).swipe('down');
			// await waitFor(element(by.id('rooms-list-view-search'))).toBeVisible().withTimeout(2000);
			// await expect(element(by.id('rooms-list-view-search'))).toBeVisible();

			await waitFor(element(by.id('rooms-list-view-search'))).toExist().withTimeout(2000);

			await element(by.id('rooms-list-view-search')).replaceText('rocket.cat');
			await sleep(2000);
			await waitFor(element(by.id('rooms-list-view-item-rocket.cat'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('rooms-list-view-item-rocket.cat'))).toBeVisible();
			await element(by.id('rooms-list-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(10000);
			await expect(element(by.id('room-view'))).toBeVisible();
			await waitFor(element(by.text('rocket.cat'))).toBeVisible().withTimeout(60000);
			await expect(element(by.text('rocket.cat'))).toBeVisible();
			await tapBack();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
			await element(by.id('rooms-list-view-search')).replaceText('');
			await sleep(2000);
			await waitFor(element(by.id('rooms-list-view-item-rocket.cat'))).toExist().withTimeout(60000);
			await expect(element(by.id('rooms-list-view-item-rocket.cat'))).toExist();
		});

		// Usage - Sidebar
		describe('SidebarView', async() => {
			it('should navigate to add server', async() => {
				await element(by.id('rooms-list-header-server-dropdown-button')).tap();
				await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible();
				await expect(element(by.id('rooms-list-header-server-add'))).toBeVisible();
				await element(by.id('rooms-list-header-server-add')).tap();
				await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('onboarding-view'))).toBeVisible();
				await element(by.id('onboarding-close')).tap();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('rooms-list-view'))).toBeVisible();
			});
	
			it('should logout', async() => {
				await element(by.id('rooms-list-view-sidebar')).tap();
				await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
				await waitFor(element(by.id('sidebar-logout'))).toBeVisible().withTimeout(2000);
				await element(by.id('sidebar-logout')).tap();
				await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('onboarding-view'))).toBeVisible();
			});
		});

		afterEach(async() => {
			takeScreenshot();
		});

		after(async() => {
			await navigateToLogin();
			await login();
		});
	});
});
