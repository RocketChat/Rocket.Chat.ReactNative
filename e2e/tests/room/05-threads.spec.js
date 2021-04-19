const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { navigateToLogin, login, mockMessage, tapBack, sleep, searchRoom, starMessage, pinMessage, dismissReviewNag, tryTapping } = require('../../helpers/app');

async function navigateToRoom(roomName) {
	await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
	await navigateToLogin();
	await login(data.users.regular.username, data.users.regular.password);
	await searchRoom(`${ roomName }`);
	await element(by.id(`rooms-list-view-item-${ roomName }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
}

describe('Threads', () => {
	const mainRoom = data.groups.private.name;

	before(async() => {
		await navigateToRoom(mainRoom);
	});

	describe('Render', async() => {
		it('should have room screen', async() => {
			await expect(element(by.id('room-view'))).toExist();
			await waitFor(element(by.id(`room-view-title-${ mainRoom }`))).toExist().withTimeout(5000);
		});

		// Render - Header
		describe('Header', async() => {
			it('should have actions button ', async() => {
				await expect(element(by.id('room-header'))).toExist();
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
		describe('Thread', async() => {
			const thread = `${ data.random }thread`;
			it('should create thread', async() => {
				await mockMessage('thread');
				await element(by.label(thread)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Reply in Thread')).tap();
				await element(by.id('messagebox-input')).typeText('replied');
				await element(by.id('messagebox-send-message')).tap();
				await waitFor(element(by.id(`message-thread-button-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id(`message-thread-button-${ thread }`))).toExist();
			});

			it('should navigate to thread from button', async() => {
				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await waitFor(element(by.id('room-view'))).toExist().withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id(`room-view-title-${ thread }`))).toExist();
				await tapBack();
			});

			it('should toggle follow thread', async() => {
				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await waitFor(element(by.id('room-view'))).toExist().withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id(`room-view-title-${ thread }`))).toExist();
				await element(by.id('room-view-header-unfollow')).tap();
				await waitFor(element(by.id('room-view-header-follow'))).toExist().withTimeout(60000);
				await expect(element(by.id('room-view-header-follow'))).toExist();
				await element(by.id('room-view-header-follow')).tap();
				await waitFor(element(by.id('room-view-header-unfollow'))).toExist().withTimeout(60000);
				await expect(element(by.id('room-view-header-unfollow'))).toExist();
			});

			it('should send message in thread only', async() => {
				const messageText = 'threadonly';
				await mockMessage(messageText, true);
				await tapBack();
				await waitFor(element(by.id('room-header').and(by.label(`${ mainRoom }`)))).toBeVisible().withTimeout(2000);	
				await waitFor(element(by.id('room-header').and(by.label(`${ data.random }thread`)))).toBeNotVisible().withTimeout(2000);	
				await sleep(500) //TODO: Find a better way to wait for the animation to finish and the messagebox-input to be available and usable :(
				await waitFor(element(by.label(`${ data.random }${ messageText }`)).atIndex(0)).toNotExist().withTimeout(2000);
			});

			it('should mark send to channel and show on main channel', async() => {
				const messageText = 'sendToChannel';
				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await element(by.id('messagebox-input-thread')).typeText(messageText);
				await element(by.id('messagebox-send-to-channel')).tap();
				await element(by.id('messagebox-send-message')).tap();
				await tapBack();
				await waitFor(element(by.id('room-header').and(by.label(`${ mainRoom }`)))).toBeVisible().withTimeout(2000);	
				await waitFor(element(by.id('room-header').and(by.label(`${ data.random }thread`)))).toBeNotVisible().withTimeout(2000);	
				await sleep(500) //TODO: Find a better way to wait for the animation to finish and the messagebox-input to be available and usable :(
				await waitFor(element(by.label(messageText)).atIndex(0)).toExist().withTimeout(2000);
			});

			it('should navigate to thread from thread name', async() => {
				const messageText = 'navthreadname';
				await mockMessage('dummymessagebetweenthethread');
				await dismissReviewNag() //TODO: Create a proper test for this elsewhere.
				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await element(by.id('messagebox-input-thread')).typeText(messageText);
				await element(by.id('messagebox-send-to-channel')).tap();
				await element(by.id('messagebox-send-message')).tap();
				await tapBack();
				await waitFor(element(by.id('room-header').and(by.label(`${ mainRoom }`)))).toBeVisible().withTimeout(2000);	
				await waitFor(element(by.id('room-header').and(by.label(`${ data.random }thread`)))).toBeNotVisible().withTimeout(2000);	
				await waitFor(element(by.id(`message-thread-replied-on-${ thread }`))).toBeVisible().withTimeout(2000);	
				await element(by.id(`message-thread-replied-on-${ thread }`)).tap();
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id(`room-view-title-${ thread }`))).toExist();
				await tapBack();
			});

			it('should navigate to thread from threads view', async() => {
				await waitFor(element(by.id('room-view-header-threads'))).toExist().withTimeout(1000);
				await element(by.id('room-view-header-threads')).tap();
				await waitFor(element(by.id('thread-messages-view'))).toExist().withTimeout(5000);
				await expect(element(by.id('thread-messages-view'))).toExist();
				await element(by.id(`thread-messages-view-${ thread }`)).atIndex(0).tap();
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id(`room-view-title-${ thread }`))).toExist();
				await tapBack();
				await waitFor(element(by.id('thread-messages-view'))).toExist().withTimeout(5000);
				await expect(element(by.id('thread-messages-view'))).toExist();
				await tapBack();
			});

			it('should draft thread message', async () => {
				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toExist().withTimeout(5000);
				await element(by.id('messagebox-input-thread')).typeText(`${ thread }draft`);
				await tapBack();

				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id('messagebox-input-thread'))).toHaveText(`${ thread }draft`);
				await element(by.id('messagebox-input-thread')).clearText();
				await tapBack();

				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id('messagebox-input-thread'))).toHaveText('');
			});
		});
	});
});
