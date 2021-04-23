const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { navigateToLogin, login, mockMessage, tapBack, sleep, searchRoom, starMessage, pinMessage, dismissReviewNag, tryTapping, logout } = require('../../helpers/app');

async function navigateToRoom(roomName) {
	await searchRoom(`${ roomName }`);
	await element(by.id(`rooms-list-view-item-${ roomName }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
}

describe('Room screen', () => {
	const mainRoom = data.groups.private.name;

	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
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

			it('should not show emoji autocomplete on semicolon in middle of a string', async() => {
				await element(by.id('messagebox-input')).tap();
				// await element(by.id('messagebox-input')).replaceText(':');
				await element(by.id('messagebox-input')).typeText('name:is'); 
				await waitFor(element(by.id('messagebox-container'))).toNotExist().withTimeout(20000);
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

			it('should not show user autocomplete on @ in the middle of a string', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText(`email@gmail`);
				await waitFor(element(by.id('messagebox-container'))).toNotExist().withTimeout(4000);
				await element(by.id('messagebox-input')).clearText();
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

			it('should not show room autocomplete on # in middle of a string', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText('te#gen');
				await waitFor(element(by.id('messagebox-container'))).toNotExist().withTimeout(4000);
				await element(by.id('messagebox-input')).clearText();
			});
			it('should draft message', async () => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText(`${ data.random }draft`);
				await tapBack();

				await navigateToRoom(mainRoom);
				await expect(element(by.id('messagebox-input'))).toHaveText(`${ data.random }draft`);
				await element(by.id('messagebox-input')).clearText();
				await tapBack();

				await navigateToRoom(mainRoom);
				await expect(element(by.id('messagebox-input'))).toHaveText('');
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
				await element(by.id('action-sheet-handle')).swipe('up', 'slow', 0.5);
				await waitFor(element(by.label('Unstar'))).toBeVisible().withTimeout(6000);
				await element(by.id('action-sheet-handle')).swipe('down', 'fast', 0.8);
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

				await waitFor(element(by.label(`${ data.random }pin`)).atIndex(0)).toExist().withTimeout(5000);
				await waitFor(element(by.label(`${ data.users.regular.username } Message pinned`)).atIndex(0)).toExist().withTimeout(5000);
				await element(by.label(`${ data.random }pin`)).atIndex(0).longPress();
				await waitFor(element(by.id('action-sheet'))).toExist().withTimeout(1000);
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await waitFor(element(by.label('Unpin'))).toBeVisible().withTimeout(2000);
				await element(by.id('action-sheet-handle')).swipe('down', 'fast', 0.8);
			});

			it('should delete message', async() => {
				await mockMessage('delete')

				await waitFor(element(by.label(`${ data.random }delete`)).atIndex(0)).toBeVisible();
				await element(by.label(`${ data.random }delete`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await waitFor(element(by.label('Delete'))).toExist().withTimeout(1000);
				await element(by.label('Delete')).tap();

				const deleteAlertMessage = 'You will not be able to recover this message!';
				await waitFor(element(by.text(deleteAlertMessage)).atIndex(0)).toExist().withTimeout(10000);
				await element(by.text('Delete')).tap();

				await waitFor(element(by.label(`${ data.random }delete`)).atIndex(0)).toNotExist().withTimeout(2000);
			});
		});
	});
});
