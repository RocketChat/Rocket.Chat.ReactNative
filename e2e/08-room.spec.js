const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const data = require('./data');
const { tapBack, sleep } = require('./helpers/app');

async function mockMessage(message) {
	await element(by.id('messagebox-input')).tap();
	await element(by.id('messagebox-input')).typeText(`${ data.random }${ message }`);
	await element(by.id('messagebox-send-message')).tap();
	await waitFor(element(by.text(`${ data.random }${ message }`))).toExist().withTimeout(60000);
};

async function navigateToRoom() {
	await element(by.id('rooms-list-view-search')).replaceText(`private${ data.random }`);
	await sleep(2000);
    await waitFor(element(by.id(`rooms-list-view-item-private${ data.random }`))).toBeVisible().withTimeout(60000);
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
			await expect(element(by.id('room-view'))).toBeVisible();
			await waitFor(element(by.id(`room-view-title-${ mainRoom }`))).toBeVisible().withTimeout(5000);
			await expect(element(by.id(`room-view-title-${ mainRoom }`))).toBeVisible();
		});

		it('should have messages list', async() => {
			await expect(element(by.id('room-view-messages'))).toBeVisible();
		});

		// Render - Header
		describe('Header', async() => {
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
		describe('Header', async() => {
			it('should back to rooms list', async() => {
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('rooms-list-view'))).toBeVisible();
				await navigateToRoom();
			});
	
			it('should tap on more and navigate to room actions', async() => {
				await element(by.id('room-view-header-actions')).tap();
				await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('room-actions-view'))).toBeVisible();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			});
		});

		describe('Messagebox', async() => {
			it('should send message', async() => {
				await mockMessage('message');
				await expect(element(by.text(`${ data.random }message`))).toExist();
			});
	
			it('should show/hide emoji keyboard', async() => {
				await element(by.id('messagebox-open-emoji')).tap();
				await waitFor(element(by.id('messagebox-keyboard-emoji'))).toBeVisible().withTimeout(10000);
				await expect(element(by.id('messagebox-keyboard-emoji'))).toBeVisible();
				await expect(element(by.id('messagebox-close-emoji'))).toBeVisible();
				await expect(element(by.id('messagebox-open-emoji'))).toBeNotVisible();
				await element(by.id('messagebox-close-emoji')).tap();
				await waitFor(element(by.id('messagebox-keyboard-emoji'))).toBeNotVisible().withTimeout(10000);
				await expect(element(by.id('messagebox-keyboard-emoji'))).toBeNotVisible();
				await expect(element(by.id('messagebox-close-emoji'))).toBeNotVisible();
				await expect(element(by.id('messagebox-open-emoji'))).toBeVisible();
			});

			it('should show/hide emoji autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).replaceText(':');
				await element(by.id('messagebox-input')).typeText('joy'); // workaround for number keyboard
				await waitFor(element(by.id('messagebox-container'))).toBeVisible().withTimeout(10000);
				await expect(element(by.id('messagebox-container'))).toBeVisible();
				await element(by.id('messagebox-input')).clearText();
				await waitFor(element(by.id('messagebox-container'))).toBeNotVisible().withTimeout(10000);
				await expect(element(by.id('messagebox-container'))).toBeNotVisible();
			});
	
			it('should show and tap on emoji autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).replaceText(':');
				await element(by.id('messagebox-input')).typeText('joy'); // workaround for number keyboard
				await waitFor(element(by.id('messagebox-container'))).toBeVisible().withTimeout(10000);
				await expect(element(by.id('messagebox-container'))).toBeVisible();
				await element(by.id('mention-item-joy')).tap();
				await expect(element(by.id('messagebox-input'))).toHaveText(':joy: ');
				await element(by.id('messagebox-input')).clearText();
			});
	
			it('should show and tap on user autocomplete and send mention', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText(`@${ data.user }`);
				await waitFor(element(by.id('messagebox-container'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('messagebox-container'))).toBeVisible();
				await element(by.id(`mention-item-${ data.user }`)).tap();
				await expect(element(by.id('messagebox-input'))).toHaveText(`@${ data.user } `);
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText(`${ data.random }mention`);
				await element(by.id('messagebox-send-message')).tap();
				await waitFor(element(by.text(`@${ data.user } ${ data.random }mention`))).toBeVisible().withTimeout(60000);
			});
	
			it('should show and tap on room autocomplete', async() => {
				await element(by.id('messagebox-input')).tap();
				await element(by.id('messagebox-input')).typeText('#general');
				await waitFor(element(by.id('messagebox-container'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('messagebox-container'))).toBeVisible();
				await element(by.id('mention-item-general')).atIndex(0).tap();
				await expect(element(by.id('messagebox-input'))).toHaveText('#general ');
				await element(by.id('messagebox-input')).clearText();
			});
		});

		describe('Message', async() => {
			it('should show message actions', async() => {
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Message actions'))).toBeVisible().withTimeout(5000);
				await expect(element(by.text('Message actions'))).toBeVisible();
				await element(by.text('Cancel')).tap();
				await waitFor(element(by.text('Cancel'))).toBeNotVisible().withTimeout(2000);
			});

			it('should copy permalink', async() => {
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Message actions'))).toBeVisible().withTimeout(5000);
				await expect(element(by.text('Message actions'))).toBeVisible();
				await element(by.text('Permalink')).tap();
				// await expect(element(by.text('Permalink copied to clipboard!'))).toBeVisible();
				await waitFor(element(by.text('Permalink copied to clipboard!'))).toBeVisible().withTimeout(5000);
				await waitFor(element(by.text('Permalink copied to clipboard!'))).toBeNotVisible().withTimeout(5000);
				
				// TODO: test clipboard
			});

			it('should copy message', async() => {
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Message actions'))).toBeVisible().withTimeout(5000);
				await expect(element(by.text('Message actions'))).toBeVisible();
				await element(by.text('Copy')).tap();
				// await expect(element(by.text('Copied to clipboard!'))).toBeVisible();
				await waitFor(element(by.text('Copied to clipboard!'))).toBeVisible().withTimeout(5000);
				await waitFor(element(by.text('Copied to clipboard!'))).toBeNotVisible().withTimeout(5000);
				// TODO: test clipboard
			});

			it('should star message', async() => {
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Message actions'))).toBeVisible().withTimeout(5000);
				await expect(element(by.text('Message actions'))).toBeVisible();
				await element(by.text('Star')).tap();
				await waitFor(element(by.text('Message actions'))).toBeNotVisible().withTimeout(5000);
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Unstar'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Unstar'))).toBeVisible();
				await element(by.text('Cancel')).tap();
				await waitFor(element(by.text('Cancel'))).toBeNotVisible().withTimeout(2000);
			});

			it('should react to message', async() => {
				await element(by.text(`${ data.random }message`)).longPress();
				await waitFor(element(by.text('Message actions'))).toBeVisible().withTimeout(5000);
				await expect(element(by.text('Message actions'))).toBeVisible();
				await element(by.text('Add Reaction')).tap();
				await waitFor(element(by.id('reaction-picker'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('reaction-picker'))).toBeVisible();
				await element(by.id('reaction-picker-😃')).tap();
				await waitFor(element(by.id('reaction-picker-grinning'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('reaction-picker-grinning'))).toBeVisible();
				await element(by.id('reaction-picker-grinning')).tap();
				await waitFor(element(by.id('message-reaction-:grinning:'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('message-reaction-:grinning:'))).toBeVisible();
			});

			it('should show reaction picker on add reaction button pressed and have frequently used emoji', async() => {
				await element(by.id('message-add-reaction')).tap();
				await waitFor(element(by.id('reaction-picker'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('reaction-picker'))).toBeVisible();
				await waitFor(element(by.id('reaction-picker-grinning'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('reaction-picker-grinning'))).toBeVisible();
				await element(by.id('reaction-picker-😃')).tap();
				await waitFor(element(by.id('reaction-picker-grimacing'))).toBeVisible().withTimeout(2000);
				await element(by.id('reaction-picker-grimacing')).tap();
				await waitFor(element(by.id('message-reaction-:grimacing:'))).toBeVisible().withTimeout(60000);
			});

			it('should remove reaction', async() => {
				await element(by.id('message-reaction-:grinning:')).tap();
				await waitFor(element(by.id('message-reaction-:grinning:'))).toBeNotVisible().withTimeout(60000);
				await expect(element(by.id('message-reaction-:grinning:'))).toBeNotVisible();
			});

			it('should edit message', async() => {
				await mockMessage('edit');
				await element(by.text(`${ data.random }edit`)).longPress();
				await waitFor(element(by.text('Message actions'))).toBeVisible().withTimeout(5000);
				await expect(element(by.text('Message actions'))).toBeVisible();
				await element(by.text('Edit')).tap();
				await element(by.id('messagebox-input')).typeText('ed');
				await element(by.id('messagebox-send-message')).tap();
				await waitFor(element(by.text(`${ data.random }edited (edited)`))).toBeVisible().withTimeout(60000);
				await expect(element(by.text(`${ data.random }edited (edited)`))).toBeVisible();
			});

			it('should quote message', async() => {
				await mockMessage('quote');
				await element(by.text(`${ data.random }quote`)).longPress();
				await waitFor(element(by.text('Message actions'))).toBeVisible().withTimeout(5000);
				await expect(element(by.text('Message actions'))).toBeVisible();
				await element(by.text('Quote')).tap();
				await element(by.id('messagebox-input')).typeText(`${ data.random }quoted`);
				await element(by.id('messagebox-send-message')).tap();
				// TODO: test if quote was sent
			});

			it('should pin message', async() => {
				await waitFor(element(by.text(`${ data.random }edited (edited)`))).toBeVisible().whileElement(by.id('room-view-messages')).scroll(200, 'up');
				await element(by.text(`${ data.random }edited (edited)`)).longPress();
				await waitFor(element(by.text('Message actions'))).toBeVisible().withTimeout(5000);
				await expect(element(by.text('Message actions'))).toBeVisible();
				await element(by.text('Pin')).tap();
				await waitFor(element(by.text('Message actions'))).toBeNotVisible().withTimeout(5000);
				await waitFor(element(by.text(`${ data.random }edited (edited)`))).toBeVisible().whileElement(by.id('room-view-messages')).scroll(200, 'up');
				await waitFor(element(by.text(`${ data.random }edited (edited)`)).atIndex(1)).toBeVisible().withTimeout(60000);
				await element(by.text(`${ data.random }edited (edited)`)).atIndex(0).longPress();
				await waitFor(element(by.text('Unpin'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Unpin'))).toBeVisible();
				await element(by.text('Cancel')).tap();
				await waitFor(element(by.text('Cancel'))).toBeNotVisible().withTimeout(2000);
			});

			// TODO: delete message - swipe on action sheet missing
		});

		describe('Thread', async() => {
			const thread = `${ data.random }thread`;
			it('should create thread', async() => {
				await mockMessage('thread');
				await element(by.text(thread)).longPress();
				await waitFor(element(by.text('Message actions'))).toBeVisible().withTimeout(5000);
				await expect(element(by.text('Message actions'))).toBeVisible();
				await element(by.text('Reply')).tap();
				await element(by.id('messagebox-input')).typeText('replied');
				await element(by.id('messagebox-send-message')).tap();
				await waitFor(element(by.id(`message-thread-button-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id(`message-thread-button-${ thread }`))).toExist();
			});

			it('should navigate to thread from button', async() => {
				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toBeVisible().withTimeout(5000);
				await expect(element(by.id(`room-view-title-${ thread }`))).toBeVisible();
				await tapBack();
			});

			it('should toggle follow thread', async() => {
				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toBeVisible().withTimeout(5000);
				await expect(element(by.id(`room-view-title-${ thread }`))).toBeVisible();
				await element(by.id('room-view-header-unfollow')).tap();
				await waitFor(element(by.id('room-view-header-follow'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('room-view-header-follow'))).toBeVisible();
				await element(by.id('room-view-header-follow')).tap();
				await waitFor(element(by.id('room-view-header-unfollow'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('room-view-header-unfollow'))).toBeVisible();
				await tapBack();
			});

			it('should navigate to thread from thread name', async() => {
				await mockMessage('dummymessagebetweenthethread');
				await element(by.text(thread)).longPress();
				await waitFor(element(by.text('Message actions'))).toBeVisible().withTimeout(5000);
				await expect(element(by.text('Message actions'))).toBeVisible();
				await element(by.text('Reply')).tap();
				await element(by.id('messagebox-input')).typeText('repliedagain');
				await element(by.id('messagebox-send-message')).tap();
				await waitFor(element(by.id(`message-thread-replied-on-${ thread }`))).toExist().withTimeout(5000);
				await expect(element(by.id(`message-thread-replied-on-${ thread }`))).toExist();

				await element(by.id(`message-thread-replied-on-${ thread }`)).tap();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toBeVisible().withTimeout(5000);
				await expect(element(by.id(`room-view-title-${ thread }`))).toBeVisible();
				await tapBack();
			});

			it('should navigate to thread from threads view', async() => {
				await element(by.id('room-view-header-threads')).tap();
				await waitFor(element(by.id('thread-messages-view'))).toBeVisible().withTimeout(5000);
				await expect(element(by.id('thread-messages-view'))).toBeVisible();
				await element(by.id(`message-thread-button-${ thread }`)).tap();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${ thread }`))).toBeVisible().withTimeout(5000);
				await expect(element(by.id(`room-view-title-${ thread }`))).toBeVisible();
				await tapBack();
				await waitFor(element(by.id('thread-messages-view'))).toBeVisible().withTimeout(5000);
				await expect(element(by.id('thread-messages-view'))).toBeVisible();
				await tapBack();
			});
		});

		afterEach(async() => {
			takeScreenshot();
		});

		after(async() => {
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
			await tapBack();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});
	});
});
