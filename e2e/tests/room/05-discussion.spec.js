const {
	expect, element, by, waitFor
} = require('detox');
const { navigateToLogin, tapBack, login, mockMessage} = require('../../helpers/app');
const data = require('../../data');

async function createDiscussion(selectChannel = true) {
	if (selectChannel) {
		await element(by.label('Select a Channel...')).tap();
		await element(by.id('multi-select-search')).replaceText('general');
		await waitFor(element(by.id(`multi-select-item-general`))).toExist().withTimeout(400);
		await element(by.id('multi-select-item-general')).tap();
	}
	await element(by.id('multi-select-discussion-name')).replaceText(`${data.random} Discussion Test ${selectChannel ? 'selected channel' : ''}`);
	await waitFor(element(by.id(`create-discussion-submit`))).toExist().withTimeout(400);
	await element(by.id('create-discussion-submit')).tap();
}

describe('Discussion', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password)
	});

	describe('Usage', () => {
		it('should navigate to NewMessageView', async() => {
			await element(by.id('rooms-list-view-create-channel')).tap();
			await element(by.label('Create Discussion')).tap();
			await createDiscussion();
			// await element(by.label('Select Users...')).tap();
			// await element(by.id('multi-select-search')).replaceText('rocket.cat');
			// await waitFor(element(by.id(`multi-select-item-rocket.cat`))).toExist().withTimeout(400);
			// await element(by.id('multi-select-item-rocket.cat')).tap();
		});

		describe('Render', async() => {
			// Render - Header
			describe('Header', async() => {
				it('should have actions button ', async() => {
					await waitFor(element(by.id(`room-view-header-actions`))).toExist().withTimeout(900);
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

		// describe('Send message', async() => {
		// 	it('should Send message', async() => {
		// 		await mockMessage('message')
		// 	});
		// });

		describe('Create Discussion from action button', async() => {
			it('should create discussion', async() => {
				await element(by.id('messagebox-actions')).tap();
				await element(by.label('Create Discussion')).tap();
				await createDiscussion(false);
				await waitFor(element(by.id(`header-back`))).toExist().withTimeout(900);
    			// await element(by.id('header-back')).tap();
				// await element(by.id('messagebox-input')).atIndex(0).tap();
    			// await element(by.id('messagebox-input')).replaceText(data.random);
			});
		});
	
	});	
});
