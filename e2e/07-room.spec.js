const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { login } = require('./helpers/app');
const data = require('./data');

async function mockMessage(message) {
	await element(by.id('messagebox-input')).tap();
	await element(by.id('messagebox-input')).typeText(`${ data.random }${ message }`);
	await element(by.id('messagebox-send-message')).tap();
	await waitFor(element(by.text(`${ data.random }${ message }`))).toBeVisible().withTimeout(2000);
};

async function navigateToRoom() {
    await waitFor(element(by.id(`rooms-list-view-item-private${ data.random }`))).toBeVisible().withTimeout(2000);
    await element(by.id(`rooms-list-view-item-private${ data.random }`)).tap();
    await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(2000);
}

describe('Room screen', () => {
	before(async() => {
		// await device.launchApp({ delete: true, permissions: { notifications: 'YES' } });
		await login();
        await navigateToRoom();
	});

	describe('Render', async() => {
		it('should have room screen', async() => {
			await expect(element(by.id('room-view'))).toBeVisible();
		});

		it('should have messages list', async() => {
			await expect(element(by.id('room-view-messages'))).toBeVisible();
		});

		// Render - Header
		describe('Header', async() => {
			it('should have room header', async() => {
				await expect(element(by.id('room-view-header'))).toBeVisible();
			});

			it('should have back button', async() => {
				await expect(element(by.id('header-back'))).toBeVisible();
			});

			it('should have title', async() => {
				await expect(element(by.id('room-view-header-title'))).toBeVisible();
			});

			it('should have star button', async() => {
				await expect(element(by.id('room-view-header-star'))).toBeVisible();
			});

			it('should have actions button ', async() => {
				await expect(element(by.id('room-view-header-actions'))).toBeVisible();
			});
		});

		// Render - Messagebox
		describe('Messagebox', async() => {
			it('should have messagebox', async() => {
				await expect(element(by.id('messagebox'))).toBeVisible();
			});

			it('should have open emoji button', async() => {
				await expect(element(by.id('messagebox-open-emoji'))).toBeVisible();
			});

			it('should have message input', async() => {
				await expect(element(by.id('messagebox-input'))).toBeVisible();
			});

			it('should have audio button', async() => {
				await expect(element(by.id('messagebox-send-audio'))).toBeVisible();
			});

			it('should have actions button', async() => {
				await expect(element(by.id('messagebox-actions'))).toBeVisible();
			});
		});

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', async() => {
		beforeEach(async() => {
			await device.reloadReactNative();
        	await navigateToRoom();
		});

		describe('Header', async() => {
			it('should back to rooms list', async() => {
				await element(by.id('header-back')).tap();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('rooms-list-view'))).toBeVisible();
			});

			it('should tap on title and navigate to room info', async() => {
				await element(by.id('room-view-header-title')).tap();
				await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('room-info-view'))).toBeVisible();
			});
	
			it('should tap on more and navigate to room actions', async() => {
				await element(by.id('room-view-header-actions')).tap();
				await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('room-actions-view'))).toBeVisible();
			});
		});

		describe('Messagebox', async() => {
			it('should send message', async() => {
				await mockMessage('message');
				await waitFor(element(by.text(`${ data.random }message`))).toBeVisible().withTimeout(2000);
				await expect(element(by.text(`${ data.random }message`))).toBeVisible();
			});
	
			it('should show/hide emoji keyboard', async() => {
				await element(by.id('messagebox-open-emoji')).tap();
				await waitFor(element(by.id('messagebox-keyboard-emoji'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('messagebox-keyboard-emoji'))).toBeVisible();
				await expect(element(by.id('messagebox-close-emoji'))).toBeVisible();
				await expect(element(by.id('messagebox-open-emoji'))).toBeNotVisible();
				await element(by.id('messagebox-close-emoji')).tap();
				await waitFor(element(by.id('messagebox-keyboard-emoji'))).toBeNotVisible().withTimeout(2000);
				await expect(element(by.id('messagebox-keyboard-emoji'))).toBeNotVisible();
				await expect(element(by.id('messagebox-close-emoji'))).toBeNotVisible();
				await expect(element(by.id('messagebox-open-emoji'))).toBeVisible();
			});

			it('should show/hide emoji autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).replaceText(':');
				await element(by.id('messagebox-input')).typeText('joy'); // workaround for number keyboard
				await waitFor(element(by.id('messagebox-container'))).toBeVisible().withTimeout(5000);
				await expect(element(by.id('messagebox-container'))).toBeVisible();
				await element(by.id('messagebox-input')).clearText();
				await waitFor(element(by.id('messagebox-container'))).toBeNotVisible().withTimeout(5000);
				await expect(element(by.id('messagebox-container'))).toBeNotVisible();
			});
	
			it('should show and tap on emoji autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).replaceText(':');
				await element(by.id('messagebox-input')).typeText('joy'); // workaround for number keyboard
				await waitFor(element(by.id('messagebox-container'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('messagebox-container'))).toBeVisible();
				await element(by.id('mention-item-joy')).tap();
				await expect(element(by.id('messagebox-input'))).toHaveText(':joy: ');
			});
	
			it('should show and tap on user autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText('@rocket');
				await waitFor(element(by.id('messagebox-container'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('messagebox-container'))).toBeVisible();
				await element(by.id('mention-item-rocket.cat')).tap();
				await expect(element(by.id('messagebox-input'))).toHaveText('@rocket.cat ');
			});
	
			it('should show and tap on room autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText('#gener');
				await waitFor(element(by.id('messagebox-container'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('messagebox-container'))).toBeVisible();
				await element(by.id('mention-item-general')).tap();
				await expect(element(by.id('messagebox-input'))).toHaveText('#general ');
			});
		});

		describe('Message', async() => {
			before(async() => {
				await element(by.id('messagebox-input')).clearText();
				await mockMessage('reply');
				await mockMessage('edit');
				await mockMessage('quote');
			});
			
			it('should show message actions', async() => {
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Messages actions'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Messages actions'))).toBeVisible();
				await element(by.text('Cancel')).tap();
			});

			it('should reply message', async() => {
				await element(by.text(`${ data.random }reply`)).longPress();
				await waitFor(element(by.text('Messages actions'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Messages actions'))).toBeVisible();
				await element(by.text('Reply')).tap();
				await element(by.id('messagebox-input')).typeText('replied');
				await element(by.id('messagebox-send-message')).tap();
				// TODO: test if reply was sent
			});

			it('should edit message', async() => {
				await element(by.text(`${ data.random }edit`)).longPress();
				await waitFor(element(by.text('Messages actions'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Messages actions'))).toBeVisible();
				await element(by.text('Edit')).tap();
				await element(by.id('messagebox-input')).typeText('ed');
				await element(by.id('messagebox-send-message')).tap();
				await waitFor(element(by.text(`${ data.random }edited`))).toBeVisible().withTimeout(2000);
				await expect(element(by.text(`${ data.random }edited`))).toBeVisible();
			});

			it('should copy message', async() => {
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Messages actions'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Messages actions'))).toBeVisible();
				await element(by.text('Copy Message')).tap();
				await expect(element(by.text('Copied to clipboard!'))).toBeVisible();
				// TODO: test clipboard
			});

			it('should copy permalink', async() => {
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Messages actions'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Messages actions'))).toBeVisible();
				await element(by.text('Copy Permalink')).tap();
				await expect(element(by.text('Permalink copied to clipboard!'))).toBeVisible();
				// TODO: test clipboard
			});

			it('should quote message', async() => {
				await element(by.text(`${ data.random }quote`)).longPress();
				await waitFor(element(by.text('Messages actions'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Messages actions'))).toBeVisible();
				await element(by.text('Quote')).tap();
				await element(by.id('messagebox-input')).typeText(`${ data.random }quoted`);
				await element(by.id('messagebox-send-message')).tap();
				// TODO: test if quote was sent
			});

			it('should star message', async() => {
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Messages actions'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Messages actions'))).toBeVisible();
				await element(by.text('Star')).tap();
				await waitFor(element(by.text('Messages actions'))).toBeNotVisible().withTimeout(2000);
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Unstar'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Unstar'))).toBeVisible();
				await element(by.text('Cancel')).tap();
			});

			it('should react to message', async() => {
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Messages actions'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Messages actions'))).toBeVisible();
				await element(by.text('Add Reaction')).tap();
				await waitFor(element(by.id('reaction-picker'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('reaction-picker'))).toBeVisible();
				await element(by.id('reaction-picker-😃')).tap();
				await waitFor(element(by.id('reaction-picker-grinning'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('reaction-picker-grinning'))).toBeVisible();
				await element(by.id('reaction-picker-grinning')).tap();
				await waitFor(element(by.id('message-reaction-:grinning:'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('message-reaction-:grinning:'))).toBeVisible();
			});

			it('should show reaction picker on add reaction button pressed and have frequently used emoji', async() => {
				await element(by.id('message-add-reaction')).tap();
				await waitFor(element(by.id('reaction-picker'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('reaction-picker'))).toBeVisible();
				await element(by.id('reaction-picker-🕒')).tap();
				await waitFor(element(by.id('reaction-picker-grinning'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('reaction-picker-grinning'))).toBeVisible();
			});

			it('should remove reaction', async() => {
				await element(by.id('message-reaction-:grinning:')).tap();
				await waitFor(element(by.id('message-reaction-:grinning:'))).toBeNotVisible().withTimeout(2000);
				await expect(element(by.id('message-reaction-:grinning:'))).toBeNotVisible();
			});

			it('should pin message', async() => {
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Messages actions'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Messages actions'))).toBeVisible();
				await element(by.text('Pin')).tap();
				await waitFor(element(by.text('Messages actions'))).toBeNotVisible().withTimeout(2000);
				await element(by.text(`${ data.random }message`)).atIndex(0).longPress();
				await waitFor(element(by.text('Unpin'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Unpin'))).toBeVisible();
				await element(by.text('Cancel')).tap();
			});

			// TODO: delete message
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});
});
