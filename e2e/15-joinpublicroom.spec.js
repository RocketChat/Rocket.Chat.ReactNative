const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('./data');
const { tapBack, sleep } = require('./helpers/app');

const room = 'detox-public';

async function mockMessage(message) {
	await element(by.id('messagebox-input')).tap();
	await element(by.id('messagebox-input')).typeText(`${ data.random }${ message }`);
	await element(by.id('messagebox-send-message')).tap();
	await waitFor(element(by.label(`${ data.random }${ message }`)).atIndex(0)).toExist().withTimeout(60000);
	await sleep(1000);
};

async function navigateToRoom() {
	await sleep(2000);
	await element(by.type('UIScrollView')).atIndex(1).scrollTo('top');
	await element(by.id('rooms-list-view-search')).typeText(room);
	await sleep(2000);
	await waitFor(element(by.id(`rooms-list-view-item-${ room }`)).atIndex(0)).toBeVisible().withTimeout(60000);
	await element(by.id(`rooms-list-view-item-${ room }`)).atIndex(0).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
}

async function navigateToRoomActions() {
	await sleep(2000);
	await element(by.id('room-view-header-actions')).tap();
	await sleep(2000);
	await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(5000);
}

describe('Join public room', () => {
	before(async() => {
		await device.launchApp({ newInstance: true });
		await navigateToRoom();
	});

	describe('Render', async() => {
		it('should have room screen', async() => {
			await expect(element(by.id('room-view'))).toBeVisible();
		});

		// it('should have messages list', async() => {
		// 	await expect(element(by.id('room-view-messages'))).toBeVisible();
		// });

		// Render - Header
		describe('Header', async() => {
			it('should have actions button ', async() => {
				await expect(element(by.id('room-view-header-actions'))).toBeVisible();
			});
		});

		// Render - Join
		describe('Join', async() => {
			it('should have join', async() => {
				await expect(element(by.id('room-view-join'))).toBeVisible();
			});

			it('should have join text', async() => {
				await expect(element(by.label('You are in preview mode'))).toBeVisible();
			});

			it('should have join button', async() => {
				await expect(element(by.id('room-view-join-button'))).toBeVisible();
			});

			it('should not have messagebox', async() => {
				await expect(element(by.id('messagebox'))).toBeNotVisible();
			});
		});

		describe('Room Actions', async() => {
			before(async() => {
				await navigateToRoomActions('c');
			});

			it('should have room actions screen', async() => {
				await expect(element(by.id('room-actions-view'))).toBeVisible();
			});

			it('should have info', async() => {
				await expect(element(by.id('room-actions-info'))).toBeVisible();
			});

			// it('should have voice', async() => {
			// 	await expect(element(by.id('room-actions-voice'))).toBeVisible();
			// });

			// it('should have video', async() => {
			// 	await expect(element(by.id('room-actions-video'))).toBeVisible();
			// });

			it('should have members', async() => {
				await expect(element(by.id('room-actions-members'))).toBeVisible();
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
				await element(by.type('UIScrollView')).atIndex(1).swipe('down');
				await expect(element(by.id('room-actions-share'))).toBeVisible();
			});

			it('should have pinned', async() => {
				await expect(element(by.id('room-actions-pinned'))).toBeVisible();
			});

			it('should not have notifications', async() => {
				await expect(element(by.id('room-actions-notifications'))).toBeNotVisible();
			});

			it('should not have leave channel', async() => {
				await expect(element(by.id('room-actions-leave-channel'))).toBeNotVisible();
			});

			after(async() => {
				await tapBack();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(2000);
			})
		});
	});

	describe('Usage', async() => {
		it('should join room', async() => {
			await element(by.id('room-view-join-button')).tap();
			await tapBack();
			await element(by.id(`rooms-list-view-item-${ room }`)).tap();
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
			await waitFor(element(by.id('messagebox'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('messagebox'))).toBeVisible();
			await expect(element(by.id('room-view-join'))).toBeNotVisible();
		});

		it('should send message', async() => {
			await mockMessage('message');
			await expect(element(by.label(`${ data.random }message`)).atIndex(0)).toExist();
			await element(by.label(`${ data.random }message`)).atIndex(0).tap();
		});

		it('should have disable notifications and leave channel', async() => {
			await navigateToRoomActions('c');
			await expect(element(by.id('room-actions-view'))).toBeVisible();
			await expect(element(by.id('room-actions-info'))).toBeVisible();
			// await expect(element(by.id('room-actions-voice'))).toBeVisible();
			// await expect(element(by.id('room-actions-video'))).toBeVisible();
			await expect(element(by.id('room-actions-members'))).toBeVisible();
			await expect(element(by.id('room-actions-files'))).toBeVisible();
			await expect(element(by.id('room-actions-mentioned'))).toBeVisible();
			await expect(element(by.id('room-actions-starred'))).toBeVisible();
			await expect(element(by.id('room-actions-search'))).toBeVisible();
			await element(by.type('UIScrollView')).atIndex(1).swipe('down');
			await expect(element(by.id('room-actions-share'))).toBeVisible();
			await expect(element(by.id('room-actions-pinned'))).toBeVisible();
			await expect(element(by.id('room-actions-notifications'))).toBeVisible();
			await expect(element(by.id('room-actions-leave-channel'))).toBeVisible();
		});

		it('should leave room', async() => {
			await element(by.id('room-actions-leave-channel')).tap();
			await waitFor(element(by.text('Yes, leave it!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Yes, leave it!'))).toBeVisible();
			await element(by.text('Yes, leave it!')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
			// await element(by.id('rooms-list-view-search')).typeText('');
			await sleep(2000);
			await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toBeNotVisible().withTimeout(60000);
			await expect(element(by.id(`rooms-list-view-item-${ room }`))).toBeNotVisible();
		});
	});
});
