const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { tapBack, sleep, searchRoom } = require('../../helpers/app');

async function mockMessage(message) {
	await element(by.id('messagebox-input')).tap();
	await element(by.id('messagebox-input')).typeText(`${ data.random }${ message }`);
	await element(by.id('messagebox-send-message')).tap();
	await waitFor(element(by.label(`${ data.random }${ message }`)).atIndex(0)).toExist().withTimeout(60000);
	await expect(element(by.label(`${ data.random }${ message }`)).atIndex(0)).toExist();
};

async function navigateToRoom() {
	await searchRoom(`private${ data.random }`);
	await waitFor(element(by.id(`rooms-list-view-item-private${ data.random }`))).toExist().withTimeout(60000);
	await element(by.id(`rooms-list-view-item-private${ data.random }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
}

describe('Room screen', () => {
	const mainRoom = `private${ data.random }`;

	before(async() => {
		await navigateToRoom();
	});

	describe('Render', async() => {
		it('should have room screen', async() => {
			await expect(element(by.id('room-view'))).toExist();
			await waitFor(element(by.id(`room-view-title-${ mainRoom }`))).toExist().withTimeout(5000);
			await expect(element(by.id(`room-view-title-${ mainRoom }`))).toExist();
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

			it('should ask for review', async() => {
				await waitFor(element(by.text('Are you enjoying this app?'))).toExist().withTimeout(60000);
				await expect(element(by.text('Are you enjoying this app?')).atIndex(0)).toExist();
				await element(by.label('No').and(by.type('_UIAlertControllerActionView'))).tap(); // Tap `no` on ask for review alert
			})

			it('should show/hide emoji keyboard', async () => {
				if (device.getPlatform() === 'android') {
					await element(by.id('messagebox-open-emoji')).tap();
					await waitFor(element(by.id('messagebox-keyboard-emoji'))).toExist().withTimeout(10000);
					await expect(element(by.id('messagebox-keyboard-emoji'))).toExist();
					await expect(element(by.id('messagebox-close-emoji'))).toExist();
					await expect(element(by.id('messagebox-open-emoji'))).toBeNotVisible();
					await element(by.id('messagebox-close-emoji')).tap();
					await waitFor(element(by.id('messagebox-keyboard-emoji'))).toBeNotVisible().withTimeout(10000);
					await expect(element(by.id('messagebox-keyboard-emoji'))).toBeNotVisible();
					await expect(element(by.id('messagebox-close-emoji'))).toBeNotVisible();
					await expect(element(by.id('messagebox-open-emoji'))).toExist();
				}
			});

			it('should show/hide emoji autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText(':joy');
				await waitFor(element(by.id('messagebox-container'))).toExist().withTimeout(10000);
				await expect(element(by.id('messagebox-container'))).toExist();
				await element(by.id('messagebox-input')).clearText();
				await waitFor(element(by.id('messagebox-container'))).toBeNotVisible().withTimeout(10000);
				await expect(element(by.id('messagebox-container'))).toBeNotVisible();
			});

			it('should show and tap on emoji autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).replaceText(':');
				await element(by.id('messagebox-input')).typeText('joy'); // workaround for number keyboard
				await waitFor(element(by.id('messagebox-container'))).toExist().withTimeout(10000);
				await expect(element(by.id('messagebox-container'))).toExist();
				await sleep(1000);
				await element(by.id('mention-item-joy')).tap();
				await expect(element(by.id('messagebox-input'))).toHaveText(':joy: ');
				await element(by.id('messagebox-input')).clearText();
			});

			it('should show and tap on user autocomplete and send mention', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText(`@${ data.user }`);
				await waitFor(element(by.id('messagebox-container'))).toExist().withTimeout(60000);
				await expect(element(by.id('messagebox-container'))).toExist();
				await sleep(1000);
				await element(by.id(`mention-item-${ data.user }`)).tap();
				await expect(element(by.id('messagebox-input'))).toHaveText(`@${ data.user } `);
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText(`${ data.random }mention`);
				await element(by.id('messagebox-send-message')).tap();
				// await waitFor(element(by.label(`@${ data.user } ${ data.random }mention`)).atIndex(0)).toExist().withTimeout(60000);
				await sleep(2000);
			});

			it('should show and tap on room autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText('#general');
				await waitFor(element(by.id('messagebox-container'))).toExist().withTimeout(60000);
				await expect(element(by.id('messagebox-container'))).toExist();
				await sleep(1000);
				await element(by.id('mention-item-general')).tap();
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
				await sleep(1000);
		
				// TODO: test clipboard
			});
		
			it('should copy message', async() => {
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Copy')).tap();
				await sleep(1000);
		
				// TODO: test clipboard
			});
		
			it('should star message', async() => {
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Star')).tap();
				await sleep(1000);
				await waitFor(element(by.id('action-sheet'))).toNotExist().withTimeout(5000);
		
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await waitFor(element(by.label('Unstar'))).toBeVisible().withTimeout(2000);
				await expect(element(by.label('Unstar'))).toBeVisible();
				await element(by.id('action-sheet-backdrop')).tap();
				await sleep(1000);
			});
		
			it('should react to message', async() => {
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.id('add-reaction')).tap();
				await waitFor(element(by.id('reaction-picker'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('reaction-picker'))).toBeVisible();
				await element(by.id('reaction-picker-😃')).tap();
				await waitFor(element(by.id('reaction-picker-grinning'))).toExist().withTimeout(2000);
				await expect(element(by.id('reaction-picker-grinning'))).toExist();
				await element(by.id('reaction-picker-grinning')).tap();
				await waitFor(element(by.id('message-reaction-:grinning:'))).toExist().withTimeout(60000);
				await expect(element(by.id('message-reaction-:grinning:'))).toExist();
				await sleep(1000);
			});

			it('should react to message with frequently used emoji', async() => {
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await waitFor(element(by.id('message-actions-emoji-+1'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('message-actions-emoji-+1'))).toBeVisible();
				await element(by.id('message-actions-emoji-+1')).tap();
				await waitFor(element(by.id('message-reaction-:+1:'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('message-reaction-:+1:'))).toBeVisible();
				await sleep(1000);
			});
		
			it('should show reaction picker on add reaction button pressed and have frequently used emoji', async() => {
				await element(by.id('message-add-reaction')).tap();
				await waitFor(element(by.id('reaction-picker'))).toExist().withTimeout(2000);
				await expect(element(by.id('reaction-picker'))).toExist();
				await waitFor(element(by.id('reaction-picker-grinning'))).toExist().withTimeout(2000);
				await expect(element(by.id('reaction-picker-grinning'))).toExist();
				await element(by.id('reaction-picker-😃')).tap();
				await waitFor(element(by.id('reaction-picker-grimacing'))).toExist().withTimeout(2000);
				await element(by.id('reaction-picker-grimacing')).tap();
				await waitFor(element(by.id('message-reaction-:grimacing:'))).toExist().withTimeout(60000);
				await sleep(1000);
			});
		
			it('should remove reaction', async() => {
				await element(by.id('message-reaction-:grinning:')).tap();
				await waitFor(element(by.id('message-reaction-:grinning:'))).toBeNotVisible().withTimeout(60000);
				await expect(element(by.id('message-reaction-:grinning:'))).toBeNotVisible();
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
				await expect(element(by.label(`${ data.random }edited (edited)`)).atIndex(0)).toExist();
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
				await sleep(1000);
		
				// TODO: test if quote was sent
			});
		
			it('should pin message', async() => {
				await waitFor(element(by.label(`${ data.random }edited (edited)`)).atIndex(0)).toExist();
				await element(by.label(`${ data.random }edited (edited)`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Pin')).tap();
				await waitFor(element(by.id('action-sheet'))).toNotExist().withTimeout(5000);
				await sleep(1500);
		
				await waitFor(element(by.label(`${ data.random }edited (edited)`)).atIndex(0)).toBeVisible();
				await element(by.label(`${ data.random }edited (edited)`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await waitFor(element(by.label('Unpin'))).toBeVisible().withTimeout(2000);
				await expect(element(by.label('Unpin'))).toBeVisible();
				await element(by.id('action-sheet-backdrop')).tap();
			});

			it('should delete message', async() => {
				await waitFor(element(by.label(`${ data.random }quoted`)).atIndex(0)).toBeVisible();
				await element(by.label(`${ data.random }quoted`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Delete')).tap();

				const deleteAlertMessage = 'You will not be able to recover this message!';
    		await waitFor(element(by.text(deleteAlertMessage)).atIndex(0)).toExist().withTimeout(10000);
    		await expect(element(by.text(deleteAlertMessage)).atIndex(0)).toExist();
				await element(by.text('Delete')).tap();

				await sleep(1000);
				await expect(element(by.label(`${ data.random }quoted`)).atIndex(0)).toNotExist();
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
				await sleep(1000);
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
				await tapBack();
				await sleep(1000);
			});

			it('should navigate to thread from thread name', async() => {
				await mockMessage('dummymessagebetweenthethread');
				await element(by.label(thread)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Reply in Thread')).tap();
				await element(by.id('messagebox-input')).typeText('repliedagain');
				await element(by.id('messagebox-send-message')).tap();
				await waitFor(element(by.id(`message-thread-replied-on-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id(`message-thread-replied-on-${ thread }`))).toExist();

				await element(by.id(`message-thread-replied-on-${ thread }`)).tap();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id(`room-view-title-${ thread }`))).toExist();
				await tapBack();
				await sleep(1000);
			});

			it('should navigate to thread from threads view', async() => {
				await element(by.id('room-view-header-threads')).tap();
				await waitFor(element(by.id('thread-messages-view'))).toExist().withTimeout(5000);
				await expect(element(by.id('thread-messages-view'))).toExist();
				await element(by.id(`message-thread-button-${ thread }`)).atIndex(0).tap();
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