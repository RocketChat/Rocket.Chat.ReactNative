const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { login } = require('./helpers/app');
const data = require('./data');

const scrollDown = 100;

async function navigateToRoomActions(room) {
    await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toBeVisible().withTimeout(2000);
    await element(by.id(`rooms-list-view-item-${ room }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(2000);
	await element(by.id('room-view-header-actions')).tap();
	await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
}

describe.only('Room actions screen', () => {
	before(async() => {
		// await device.launchApp({ delete: true, permissions: { notifications: 'YES' } });
		await login();
	});

	describe('Render', async() => {
		// describe('Direct', async() => {
		// 	before(async() => {
		// 		await navigateToRoomActions('rocket.cat');
		// 	});

		// 	it('should have room actions screen', async() => {
		// 		await expect(element(by.id('room-actions-view'))).toBeVisible();
		// 	});
	
		// 	it('should have info', async() => {
		// 		await expect(element(by.id('room-actions-info'))).toBeVisible();
		// 	});
	
		// 	it('should have voice', async() => {
		// 		await expect(element(by.id('room-actions-voice'))).toBeVisible();
		// 	});
	
		// 	it('should have video', async() => {
		// 		await expect(element(by.id('room-actions-video'))).toBeVisible();
		// 	});
	
		// 	it('should have files', async() => {
		// 		await expect(element(by.id('room-actions-files'))).toBeVisible();
		// 	});
	
		// 	it('should have mentions', async() => {
		// 		await expect(element(by.id('room-actions-mentioned'))).toBeVisible();
		// 	});
	
		// 	it('should have starred', async() => {
		// 		await expect(element(by.id('room-actions-starred'))).toBeVisible();
		// 	});
	
		// 	it('should have search', async() => {
		// 		await expect(element(by.id('room-actions-search'))).toBeVisible();
		// 	});
	
		// 	it('should have share', async() => {
		// 		await waitFor(element(by.id('room-actions-share'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
		// 		await expect(element(by.id('room-actions-share'))).toBeVisible();
		// 	});
	
		// 	it('should have pinned', async() => {
		// 		await waitFor(element(by.id('room-actions-pinned'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
		// 		await expect(element(by.id('room-actions-pinned'))).toBeVisible();
		// 	});
	
		// 	it('should have snippeted', async() => {
		// 		await waitFor(element(by.id('room-actions-snippeted'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
		// 		await expect(element(by.id('room-actions-snippeted'))).toBeVisible();
		// 	});
	
		// 	it('should have notifications', async() => {
		// 		await waitFor(element(by.id('room-actions-notifications'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
		// 		await expect(element(by.id('room-actions-notifications'))).toBeVisible();
		// 	});

		// 	it('should have block user', async() => {
		// 		await waitFor(element(by.id('room-actions-block-user'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
		// 		await expect(element(by.id('room-actions-block-user'))).toBeVisible();
		// 	});
		// });

		describe('Channel/Group', async() => {
			before(async() => {
				await device.reloadReactNative();
				await navigateToRoomActions(`private${ data.random }`);
			});

			it('should have room actions screen', async() => {
				await expect(element(by.id('room-actions-view'))).toBeVisible();
			});
	
			it('should have info', async() => {
				await expect(element(by.id('room-actions-info'))).toBeVisible();
			});
	
			it('should have voice', async() => {
				await expect(element(by.id('room-actions-voice'))).toBeVisible();
			});
	
			it('should have video', async() => {
				await expect(element(by.id('room-actions-video'))).toBeVisible();
			});

			it('should have members', async() => {
				await expect(element(by.id('room-actions-members'))).toBeVisible();
			});

			it('should have add user', async() => {
				await expect(element(by.id('room-actions-add-user'))).toBeVisible();
			});
	
			it('should have files', async() => {
				await expect(element(by.id('room-actions-files'))).toBeVisible();
			});
	
			it('should have mentions', async() => {
				await expect(element(by.id('room-actions-mentioned'))).toBeVisible();
			});
	
			it('should have starred', async() => {
				await expect(element(by.id('room-actions-starred'))).toBeVisible();
			});
	
			it('should have search', async() => {
				await expect(element(by.id('room-actions-search'))).toBeVisible();
			});
	
			it('should have share', async() => {
				await waitFor(element(by.id('room-actions-share'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await expect(element(by.id('room-actions-share'))).toBeVisible();
			});
	
			it('should have pinned', async() => {
				await waitFor(element(by.id('room-actions-pinned'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await expect(element(by.id('room-actions-pinned'))).toBeVisible();
			});
	
			it('should have snippeted', async() => {
				await waitFor(element(by.id('room-actions-snippeted'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await expect(element(by.id('room-actions-snippeted'))).toBeVisible();
			});
	
			it('should have notifications', async() => {
				await waitFor(element(by.id('room-actions-notifications'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await expect(element(by.id('room-actions-notifications'))).toBeVisible();
			});
	
			it('should have leave channel', async() => {
				await waitFor(element(by.id('room-actions-leave-channel'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await expect(element(by.id('room-actions-leave-channel'))).toBeVisible();
			});
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', async() => {
		describe('Navigation', async() => {
			beforeEach(async() => {
				await device.reloadReactNative();
				await navigateToRoomActions(`private${ data.random }`);
			});

			it('should navigate to room info', async() => {
				await element(by.id('room-actions-info')).tap();
				await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('room-info-view'))).toBeVisible();
			});

			it('should NOT navigate to voice call', async() => {
				await element(by.id('room-actions-voice')).tap();
				await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('room-actions-view'))).toBeVisible();
			});

			it('should NOT navigate to video call', async() => {
				await element(by.id('room-actions-video')).tap();
				await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('room-actions-view'))).toBeVisible();
			});

			it('should navigate to room members', async() => {
				await element(by.id('room-actions-members')).tap();
				await waitFor(element(by.id('room-members-view'))).toExist().withTimeout(2000);
				await expect(element(by.id('room-members-view'))).toExist();
			});

			it('should navigate to add user', async() => {
				await element(by.id('room-actions-add-user')).tap();
				await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('select-users-view'))).toBeVisible();
			});

			it('should navigate to room files', async() => {
				await element(by.id('room-actions-files')).tap();
				await waitFor(element(by.id('room-files-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('room-files-view'))).toBeVisible();
			});

			it('should navigate to mentioned messages', async() => {
				await element(by.id('room-actions-mentioned')).tap();
				await waitFor(element(by.id('mentioned-messages-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('mentioned-messages-view'))).toBeVisible();
			});

			it('should navigate to starred messages', async() => {
				await element(by.id('room-actions-starred')).tap();
				await waitFor(element(by.id('starred-messages-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('starred-messages-view'))).toBeVisible();
			});

			it('should navigate to search messages', async() => {
				await element(by.id('room-actions-search')).tap();
				await waitFor(element(by.id('search-messages-view'))).toExist().withTimeout(2000);
				await expect(element(by.id('search-messages-view'))).toExist();
			});

			it('should NOT navigate to share messages', async() => {
				await waitFor(element(by.id('room-actions-share'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await element(by.id('room-actions-share')).tap();
				await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('room-actions-view'))).toBeVisible();
			});

			it('should navigate to pinned messages', async() => {
				await waitFor(element(by.id('room-actions-pinned'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await element(by.id('room-actions-pinned')).tap();
				await waitFor(element(by.id('pinned-messages-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('pinned-messages-view'))).toBeVisible();
			});

			it('should navigate to snippeted messages', async() => {
				await waitFor(element(by.id('room-actions-snippeted'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await element(by.id('room-actions-snippeted')).tap();
				await waitFor(element(by.id('snippeted-messages-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('snippeted-messages-view'))).toBeVisible();
			});

			afterEach(async() => {
				takeScreenshot();
			});
		});

		describe.only('Common', async() => {
			beforeEach(async() => {
				await device.reloadReactNative();
				await navigateToRoomActions(`private${ data.random }`);
			});

			it('should enable/disable notifications', async() => {
				await waitFor(element(by.id('room-actions-notifications'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await expect(element(by.text('Disable notifications'))).toBeVisible();
				await element(by.id('room-actions-notifications')).tap();
				await waitFor(element(by.text('Enable notifications'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Enable notifications'))).toBeVisible();
				await element(by.id('room-actions-notifications')).tap();
				await waitFor(element(by.text('Disable notifications'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Disable notifications'))).toBeVisible();
			});

			// TODO: last test must be leave
		})
	});
});
