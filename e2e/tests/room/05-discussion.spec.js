const {
	expect, element, by, waitFor
} = require('detox');
const { navigateToLogin, login, mockMessage} = require('../../helpers/app');
const data = require('../../data');

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
			await waitFor(element(by.id('create-discussion-view'))).toExist().withTimeout(60000);
			await expect(element(by.id('create-discussion-view'))).toExist();
			await element(by.label('Select a Channel...')).tap();
			await element(by.id('multi-select-search')).replaceText(`${data.groups.private.name}`);
			await waitFor(element(by.id(`multi-select-item-${data.groups.private.name}`))).toExist().withTimeout(10000);
			await element(by.id(`multi-select-item-${data.groups.private.name}`)).tap();
			await element(by.id('multi-select-discussion-name')).replaceText(`${data.random} Discussion Test`);
			await waitFor(element(by.id(`create-discussion-submit`))).toExist().withTimeout(10000);
			await element(by.id('create-discussion-submit')).tap();
			await waitFor(element(by.id('room-view'))).toExist().withTimeout(60000);
			await expect(element(by.id('room-view'))).toExist();
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

		describe('Create Discussion from action button', async() => {
			it('should create discussion', async() => {
				await element(by.id('messagebox-actions')).tap();
				await element(by.label('Create Discussion')).tap();
				await waitFor(element(by.id('create-discussion-view'))).toExist().withTimeout(60000);
				await expect(element(by.id('create-discussion-view'))).toExist();
				await element(by.id('multi-select-discussion-name')).replaceText(`${data.random} Discussion Test`);
				await waitFor(element(by.id(`create-discussion-submit`))).toExist().withTimeout(10000);
				await element(by.id('create-discussion-submit')).tap();
				await waitFor(element(by.id('room-view'))).toExist().withTimeout(60000);
				await expect(element(by.id('room-view'))).toExist();
				await waitFor(element(by.id('messagebox'))).toBeVisible().withTimeout(60000);
			});
		});

		describe('Create Discussion from action sheet', async() => {
			it('should send a message', async() => {
				await waitFor(element(by.id('messagebox'))).toBeVisible().withTimeout(60000);
				await mockMessage('message');
			});

			it('should create discussion', async() => {
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await element(by.label(`Start a Discussion`)).atIndex(0).tap();
				await waitFor(element(by.id('create-discussion-view'))).toExist().withTimeout(60000);
				await expect(element(by.id('create-discussion-view'))).toExist();
				await element(by.id('create-discussion-submit')).tap();
				await waitFor(element(by.id('room-view'))).toExist().withTimeout(60000);
				await expect(element(by.id('room-view'))).toExist();
				
			});
		});
		
		describe('RoomActionsView', async() => {
			it('should naviget to RoomActionsView', async() => {
				await waitFor(element(by.id('room-view-header-actions'))).toBeVisible().withTimeout(5000);
				await element(by.id('room-view-header-actions')).tap();
				await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(5000);
			});

			it('should have room actions screen', async() => {
				await expect(element(by.id('room-actions-view'))).toBeVisible();
			});

			it('should have info', async() => {
				await expect(element(by.id('room-actions-info'))).toBeVisible();
			});

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
				await element(by.type('UIScrollView')).atIndex(1).swipe('up');
				await expect(element(by.id('room-actions-share'))).toBeVisible();
			});

			it('should have pinned', async() => {
				await expect(element(by.id('room-actions-pinned'))).toBeVisible();
			});

			it('should not have notifications', async() => {
				await expect(element(by.id('room-actions-notifications'))).toBeVisible();
			});

			it('should not have leave channel', async() => {
				await expect(element(by.id('room-actions-leave-channel'))).toBeVisible();
			});

			it('should navigate to RoomActionView', async() => {
				await element(by.type('UIScrollView')).atIndex(1).swipe('down');
				await expect(element(by.id('room-actions-info'))).toBeVisible();
				await element(by.id('room-actions-info')).tap();
				await waitFor(element(by.id('room-info-view'))).toExist().withTimeout(60000);
				await expect(element(by.id('room-info-view'))).toExist();
			});

			it('should not have edit button', async() => {
				await expect(element(by.id('room-info-view-edit-button'))).toBeNotVisible();
			});
		});
	});	
});
