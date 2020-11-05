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
	await waitFor(element(by.id(`rooms-list-view-item-${ roomName }`))).toExist().withTimeout(60000);
	await element(by.id(`rooms-list-view-item-${ roomName }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
}

describe('Room screen', () => {
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
		describe('Messagebox', async() => {
			it('should send message', async() => {
				await mockMessage('message')
				await expect(element(by.label(`${ data.random }message`)).atIndex(0)).toExist();
			});


			it('should show/hide emoji keyboard', async () => {
				if (device.getPlatform() === 'android') {
					await element(by.id('messagebox-open-emoji')).tap();
					await waitFor(element(by.id('messagebox-keyboard-emoji'))).toExist().withTimeout(10000);
					await expect(element(by.id('messagebox-close-emoji'))).toExist();
					await expect(element(by.id('messagebox-open-emoji'))).toBeNotVisible();
					await element(by.id('messagebox-close-emoji')).tap();
					await waitFor(element(by.id('messagebox-keyboard-emoji'))).toBeNotVisible().withTimeout(10000);
					await expect(element(by.id('messagebox-close-emoji'))).toBeNotVisible();
					await expect(element(by.id('messagebox-open-emoji'))).toExist();
				}
			});

			it('should show/hide emoji autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText(':joy');
				await waitFor(element(by.id('messagebox-container'))).toExist().withTimeout(10000);
				await element(by.id('messagebox-input')).clearText();
				await waitFor(element(by.id('messagebox-container'))).toBeNotVisible().withTimeout(10000);
			});

			it('should show and tap on emoji autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).replaceText(':');
				await element(by.id('messagebox-input')).typeText('joy'); // workaround for number keyboard
				await waitFor(element(by.id('messagebox-container'))).toExist().withTimeout(10000);
				await element(by.id('mention-item-joy')).tap();
				await expect(element(by.id('messagebox-input'))).toHaveText(':joy: ');
				await element(by.id('messagebox-input')).clearText();
			});

			it('should show and tap on user autocomplete and send mention', async() => {
				const username = data.users.regular.username
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText(`@${ username }`);
				await waitFor(element(by.id('messagebox-container'))).toExist().withTimeout(4000);
				await waitFor(element(by.id(`mention-item-${ username }`))).toBeVisible().withTimeout(4000)
				await tryTapping(element(by.id(`mention-item-${ username }`)), 2000, true);
				await expect(element(by.id('messagebox-input'))).toHaveText(`@${ username } `);
				await tryTapping(element(by.id('messagebox-input')), 2000)
				await element(by.id('messagebox-input')).typeText(`${ data.random }mention`);
				await element(by.id('messagebox-send-message')).tap();
				// await waitFor(element(by.label(`@${ data.user } ${ data.random }mention`)).atIndex(0)).toExist().withTimeout(60000);
			});

			it('should show and tap on room autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText('#general');
				//await waitFor(element(by.id('messagebox-container'))).toExist().withTimeout(4000);
				await waitFor(element(by.id('mention-item-general'))).toBeVisible().withTimeout(4000);
				await tryTapping(element(by.id('mention-item-general')), 2000, true)
				await expect(element(by.id('messagebox-input'))).toHaveText('#general ');
				await element(by.id('messagebox-input')).clearText();
			});
		});

		describe('Message', async() => {
			it('should copy permalink', async() => {
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Permalink')).tap();
		
				// TODO: test clipboard
			});
		
			it('should copy message', async() => {
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Copy')).tap();
		
				// TODO: test clipboard
			});
		
			it('should star message', async() => {
				await starMessage('message')
		
				await sleep(1000) //https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/2324
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await waitFor(element(by.label('Unstar'))).toBeVisible().withTimeout(2000);
				await element(by.id('action-sheet-backdrop')).tap();
			});
		
			it('should react to message', async() => {
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.id('add-reaction')).tap();
				await waitFor(element(by.id('reaction-picker'))).toBeVisible().withTimeout(2000);
				await element(by.id('reaction-picker-😃')).tap();
				await waitFor(element(by.id('reaction-picker-grinning'))).toExist().withTimeout(2000);
				await element(by.id('reaction-picker-grinning')).tap();
				await waitFor(element(by.id('message-reaction-:grinning:'))).toExist().withTimeout(60000);
			});

			it('should react to message with frequently used emoji', async() => {
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await waitFor(element(by.id('message-actions-emoji-+1'))).toBeVisible().withTimeout(2000);
				await element(by.id('message-actions-emoji-+1')).tap();
				await waitFor(element(by.id('message-reaction-:+1:'))).toBeVisible().withTimeout(60000);
			});
		
			it('should show reaction picker on add reaction button pressed and have frequently used emoji', async() => {
				await element(by.id('message-add-reaction')).tap();
				await waitFor(element(by.id('reaction-picker'))).toExist().withTimeout(2000);
				await waitFor(element(by.id('reaction-picker-grinning'))).toExist().withTimeout(2000);
				await element(by.id('reaction-picker-😃')).tap();
				await waitFor(element(by.id('reaction-picker-grimacing'))).toExist().withTimeout(2000);
				await element(by.id('reaction-picker-grimacing')).tap();
				await waitFor(element(by.id('message-reaction-:grimacing:'))).toExist().withTimeout(60000);
			});

			it('should ask for review', async() => {
				await dismissReviewNag() //TODO: Create a proper test for this elsewhere.
			})
		
			it('should remove reaction', async() => {
				await element(by.id('message-reaction-:grinning:')).tap();
				await waitFor(element(by.id('message-reaction-:grinning:'))).toBeNotVisible().withTimeout(60000);
			});
		
			it('should edit message', async() => {
				await mockMessage('edit');
				await element(by.label(`${ data.random }edit`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Edit')).tap();
				await element(by.id('messagebox-input')).typeText('ed');
				await element(by.id('messagebox-send-message')).tap();
				await waitFor(element(by.label(`${ data.random }edited (edited)`)).atIndex(0)).toExist().withTimeout(60000);
			});
		
			it('should quote message', async() => {
				await mockMessage('quote');
				await element(by.label(`${ data.random }quote`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Quote')).tap();
				await element(by.id('messagebox-input')).typeText(`${ data.random }quoted`);
				await element(by.id('messagebox-send-message')).tap();
		
				// TODO: test if quote was sent
			});
		
			it('should pin message', async() => {
				await mockMessage('pin')
				await pinMessage('pin')
						
				await waitFor(element(by.label(`${ data.random }pin`)).atIndex(0)).toBeVisible().withTimeout(2000);
				await waitFor(element(by.label('Message pinned')).atIndex(0)).toBeVisible().withTimeout(2000);
				await element(by.label(`${ data.random }pin`)).atIndex(0).longPress();
				await waitFor(element(by.id('action-sheet'))).toExist().withTimeout(1000);
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await waitFor(element(by.label('Unpin'))).toBeVisible().withTimeout(2000);
				await element(by.id('action-sheet-backdrop')).tap();
			});

			it('should delete message', async() => {
				await mockMessage('delete')

				await waitFor(element(by.label(`${ data.random }delete`)).atIndex(0)).toBeVisible();
				await element(by.label(`${ data.random }delete`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Delete')).tap();

				const deleteAlertMessage = 'You will not be able to recover this message!';
				await waitFor(element(by.text(deleteAlertMessage)).atIndex(0)).toExist().withTimeout(10000);
				await element(by.text('Delete')).tap();

				await waitFor(element(by.label(`${ data.random }delete`)).atIndex(0)).toNotExist().withTimeout(2000);
			});
		});

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
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id(`room-view-title-${ thread }`))).toExist();
				await tapBack();
			});

			it('should toggle follow thread', async() => {
				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
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
				await mockMessage(messageText);
				await tapBack();
				await waitFor(element(by.id('room-view-header-actions').and(by.label(`${ mainRoom }`)))).toBeVisible().withTimeout(2000);	
				await waitFor(element(by.id('room-view-header-actions').and(by.label(`${ data.random }thread`)))).toBeNotVisible().withTimeout(2000);	
				await sleep(500) //TODO: Find a better way to wait for the animation to finish and the messagebox-input to be available and usable :(
				await waitFor(element(by.label(`${ data.random }${ messageText }`)).atIndex(0)).toNotExist().withTimeout(2000);
			});

			it('should mark send to channel and show on main channel', async() => {
				const messageText = 'sendToChannel';
				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await element(by.id('messagebox-input')).atIndex(0).typeText(messageText);
				await element(by.id('messagebox-send-to-channel')).tap();
				await element(by.id('messagebox-send-message')).tap();
				await tapBack();
				await waitFor(element(by.id('room-view-header-actions').and(by.label(`${ mainRoom }`)))).toBeVisible().withTimeout(2000);	
				await waitFor(element(by.id('room-view-header-actions').and(by.label(`${ data.random }thread`)))).toBeNotVisible().withTimeout(2000);	
				await sleep(500) //TODO: Find a better way to wait for the animation to finish and the messagebox-input to be available and usable :(
				await waitFor(element(by.label(messageText)).atIndex(0)).toExist().withTimeout(2000);
			});

			it('should navigate to thread from thread name', async() => {
				const messageText = 'navthreadname';
				await mockMessage('dummymessagebetweenthethread');
				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await element(by.id('messagebox-input')).atIndex(0).typeText(messageText);
				await element(by.id('messagebox-send-to-channel')).tap();
				await element(by.id('messagebox-send-message')).tap();
				await tapBack();
				await waitFor(element(by.id('room-view-header-actions').and(by.label(`${ mainRoom }`)))).toBeVisible().withTimeout(2000);	
				await waitFor(element(by.id('room-view-header-actions').and(by.label(`${ data.random }thread`)))).toBeNotVisible().withTimeout(2000);	
				await sleep(500) //TODO: Find a better way to wait for the animation to finish and the messagebox-input to be available and usable :(

				await element(by.id(`message-thread-replied-on-${ thread }`)).tap();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
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
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id(`room-view-title-${ thread }`))).toExist();
				await tapBack();
				await waitFor(element(by.id('thread-messages-view'))).toExist().withTimeout(5000);
				await expect(element(by.id('thread-messages-view'))).toExist();
				await tapBack();
			});
		});

		// after(async() => {
		// 	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
		// 	await tapBack();
		// 	await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(2000);
		// 	await expect(element(by.id('rooms-list-view'))).toExist();
		// });
	});
});