const {
	device, expect, element, by, waitFor
} = require('detox');
const { logout, tapBack, sleep, navigateToRoom } = require('../../helpers/app');

describe('Rooms list screen', () => {
	describe('Render', () => {
		it('should have rooms list screen', async() => {
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});

		it('should have room item', async() => {
			await expect(element(by.id('rooms-list-view-item-general')).atIndex(0)).toExist();
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
	});

	describe('Usage', () => {
		it('should search room and navigate', async() => {
			await navigateToRoom('rocket.cat');
			await tapBack();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
			await sleep(2000);
			await waitFor(element(by.id('rooms-list-view-item-rocket.cat'))).toExist().withTimeout(60000);
			await expect(element(by.id('rooms-list-view-item-rocket.cat'))).toExist();
		});

		it('should logout', async() => {
			await logout();
		});
	});
});
