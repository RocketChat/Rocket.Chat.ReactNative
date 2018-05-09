const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { login } = require('./helpers/app');
const data = require('./data');

const scrollDown = 100;

async function navigateToRoomActions(type) {
	let room;
	if (type === 'd') {
		room = 'rocket.cat';
	} else {
		room = `private${ data.random }`;
	}
    await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toBeVisible().withTimeout(2000);
    await element(by.id(`rooms-list-view-item-${ room }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(2000);
	await element(by.id('room-view-header-actions')).tap();
	await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
}

describe('Room actions screen', () => {
	before(async() => {
		// await device.launchApp({ delete: true, permissions: { notifications: 'YES' } });
		// await addServer();
    	// await navigateToLogin();
		// await login();
		await device.reloadReactNative();
	});

	describe('Render', async() => {
		describe('Direct', async() => {
			before(async() => {
				await navigateToRoomActions('d');
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

			it('should have block user', async() => {
				await waitFor(element(by.id('room-actions-block-user'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await expect(element(by.id('room-actions-block-user'))).toBeVisible();
			});
		});

		describe('Channel/Group', async() => {
			before(async() => {
				await device.reloadReactNative();
				await navigateToRoomActions('c');
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
				await navigateToRoomActions('c');
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
				await waitFor(element(by.id('room-members-view'))).toExist().withTimeout(5000);
				await expect(element(by.id('room-members-view'))).toExist();
			});

			it('should navigate to add user', async() => {
				await element(by.id('room-actions-add-user')).tap();
				await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(5000);
				await expect(element(by.id('select-users-view'))).toBeVisible();
			});

			it('should navigate to room files', async() => {
				await element(by.id('room-actions-files')).tap();
				await waitFor(element(by.id('room-files-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('room-files-view'))).toBeVisible();
			});

			it('should navigate to mentioned messages', async() => {
				await element(by.id('room-actions-mentioned')).tap();
				await waitFor(element(by.id('mentioned-messages-view'))).toExist().withTimeout(2000);
				await expect(element(by.id('mentioned-messages-view'))).toExist();
			});

			it('should navigate to starred messages', async() => {
				await element(by.id('room-actions-starred')).tap();
				await waitFor(element(by.id('starred-messages-view'))).toExist().withTimeout(2000);
				await expect(element(by.id('starred-messages-view'))).toExist();
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
				await waitFor(element(by.id('pinned-messages-view'))).toExist().withTimeout(2000);
				await expect(element(by.id('pinned-messages-view'))).toExist();
			});

			it('should navigate to snippeted messages', async() => {
				await waitFor(element(by.id('room-actions-snippeted'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await element(by.id('room-actions-snippeted')).tap();
				await waitFor(element(by.id('snippeted-messages-view'))).toExist().withTimeout(2000);
				await expect(element(by.id('snippeted-messages-view'))).toExist();
			});

			afterEach(async() => {
				takeScreenshot();
			});
		});

		describe('Common', async() => {
			beforeEach(async() => {
				await device.reloadReactNative();
				await navigateToRoomActions('c');
			});

			it('should show mentioned messages', async() => {
				await element(by.id('room-actions-mentioned')).tap();
				await waitFor(element(by.id('mentioned-messages-view'))).toExist().withTimeout(2000);
				await waitFor(element(by.text(`@${ data.user } test`).withAncestor(by.id('mentioned-messages-view')))).toBeVisible().withTimeout(2000);
				await expect(element(by.text(`@${ data.user } test`).withAncestor(by.id('mentioned-messages-view')))).toBeVisible();
			});

			it('should show starred message and unstar it', async() => {
				await element(by.id('room-actions-starred')).tap();
				await waitFor(element(by.id('starred-messages-view'))).toExist().withTimeout(2000);
				await expect(element(by.text(`${ data.random }message`).withAncestor(by.id('starred-messages-view')))).toBeVisible();
				await element(by.text(`${ data.random }message`).withAncestor(by.id('starred-messages-view'))).longPress();
				await waitFor(element(by.text('Unstar'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Unstar'))).toBeVisible();
				await element(by.text('Unstar')).tap();
				await waitFor(element(by.text(`${ data.random }message`).withAncestor(by.id('starred-messages-view')))).toBeNotVisible().withTimeout(2000);
				await expect(element(by.text(`${ data.random }message`).withAncestor(by.id('starred-messages-view')))).toBeNotVisible();
			});

			it('should show pinned message and unpin it', async() => {
				await waitFor(element(by.id('room-actions-pinned'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await element(by.id('room-actions-pinned')).tap();
				await waitFor(element(by.id('pinned-messages-view'))).toExist().withTimeout(2000);
				await expect(element(by.text(`${ data.random }message`).withAncestor(by.id('pinned-messages-view')))).toBeVisible();
				await element(by.text(`${ data.random }message`).withAncestor(by.id('pinned-messages-view'))).longPress();
				await waitFor(element(by.text('Unpin'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Unpin'))).toBeVisible();
				await element(by.text('Unpin')).tap();
				await waitFor(element(by.text(`${ data.random }message`).withAncestor(by.id('pinned-messages-view')))).toBeNotVisible().withTimeout(2000);
				await expect(element(by.text(`${ data.random }message`).withAncestor(by.id('pinned-messages-view')))).toBeNotVisible();
			});

			it('should search and find a message', async() => {
				await element(by.id('room-actions-search')).tap();
				await waitFor(element(by.id('search-messages-view'))).toExist().withTimeout(2000);
				await expect(element(by.id('search-message-view-input'))).toBeVisible();
				await element(by.id('search-message-view-input')).tap();
				await element(by.id('search-message-view-input')).replaceText(`/${ data.random }message/`);
				await waitFor(element(by.text(`${ data.random }message`).withAncestor(by.id('search-messages-view'))).atIndex(0)).toBeVisible().withTimeout(10000);
				await expect(element(by.text(`${ data.random }message`).withAncestor(by.id('search-messages-view'))).atIndex(0)).toBeVisible();
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

			afterEach(async() => {
				takeScreenshot();
			});
		})

		describe('Direct', async() => {
			beforeEach(async() => {
				await device.reloadReactNative();
				await navigateToRoomActions('d');
			});

			it('should block/unblock user', async() => {
				await waitFor(element(by.id('room-actions-block-user'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await element(by.id('room-actions-block-user')).tap();
				await waitFor(element(by.text('Unblock user'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Unblock user'))).toBeVisible();
				await element(by.id('room-actions-block-user')).tap();
				await waitFor(element(by.text('Block user'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Block user'))).toBeVisible();
			});

			afterEach(async() => {
				takeScreenshot();
			});
		});

		describe('Channel/Group', async() => {
			beforeEach(async() => {
				await device.reloadReactNative();
				await navigateToRoomActions('c');
			});

			describe('Add User', async() => {
				beforeEach(async() => {
					await element(by.id('room-actions-add-user')).tap();
					await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
					await expect(element(by.id('select-users-view'))).toBeVisible();
				});

				it('should add user to the room', async() => {
					const user = 'diego.detox';
					await element(by.id('select-users-view-search')).tap();
					await element(by.id('select-users-view-search')).replaceText(user);
					await waitFor(element(by.id(`select-users-view-item-${ user }`))).toBeVisible().withTimeout(2000);
					await expect(element(by.id(`select-users-view-item-${ user }`))).toBeVisible();
					await element(by.id(`select-users-view-item-${ user }`)).tap();
					await waitFor(element(by.id(`selected-user-${ user }`))).toBeVisible().withTimeout(2000);
					await expect(element(by.id(`selected-user-${ user }`))).toBeVisible();
					await element(by.id('selected-users-view-submit')).tap();
					await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(2000);
					await element(by.id('room-view-header-actions')).tap();
					await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
					await element(by.id('room-actions-members')).tap();
					await element(by.id('room-members-view-toggle-status')).tap();
					await waitFor(element(by.id(`room-members-view-item-${ user }`))).toBeVisible().withTimeout(2000);
					await expect(element(by.id(`room-members-view-item-${ user }`))).toBeVisible();
				});

				afterEach(async() => {
					takeScreenshot();
				});
			});

			describe('Room Members', async() => {
				const user = 'diego.detox';
				beforeEach(async() => {
					await element(by.id('room-actions-members')).tap();
					await waitFor(element(by.id('room-members-view'))).toExist().withTimeout(2000);
					await expect(element(by.id('room-members-view'))).toExist();
				});

				it('should navigate to direct room', async() => {
					await element(by.id(`room-members-view-item-${ data.user }`)).tap();
					await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
					await expect(element(by.id('room-view'))).toBeVisible();
					await expect(element(by.id('room-view-title'))).toHaveText(data.user);
				});

				it('should show/hide all users', async() => {
					await element(by.id('room-members-view-toggle-status')).tap();
					await waitFor(element(by.id(`room-members-view-item-${ user }`))).toBeVisible().withTimeout(2000);
					await expect(element(by.id(`room-members-view-item-${ user }`))).toBeVisible();
					await element(by.id('room-members-view-toggle-status')).tap();
					await waitFor(element(by.id(`room-members-view-item-${ user }`))).toBeNotVisible().withTimeout(2000);
					await expect(element(by.id(`room-members-view-item-${ user }`))).toBeNotVisible();
				});

				it('should filter user', async() => {
					await element(by.id('room-members-view-toggle-status')).tap();
					await waitFor(element(by.id(`room-members-view-item-${ user }`))).toBeVisible().withTimeout(2000);
					await expect(element(by.id(`room-members-view-item-${ user }`))).toBeVisible();
					await element(by.id('room-members-view-search')).tap();
					await element(by.id('room-members-view-search')).typeText('rocket');
					await waitFor(element(by.id(`room-members-view-item-${ user }`))).toBeNotVisible().withTimeout(2000);
					await expect(element(by.id(`room-members-view-item-${ user }`))).toBeNotVisible();
				});

				it('should mute user', async() => {
					await element(by.id('room-members-view-toggle-status')).tap();
					await waitFor(element(by.id(`room-members-view-item-${ user }`))).toBeVisible().withTimeout(2000);
					await expect(element(by.id(`room-members-view-item-${ user }`))).toBeVisible();
					await element(by.id(`room-members-view-item-${ user }`)).longPress();
					await waitFor(element(by.text('Mute'))).toBeVisible().withTimeout(2000);
					await expect(element(by.text('Mute'))).toBeVisible();
					await element(by.text('Mute')).tap();
					await waitFor(element(by.text('User has been muted!'))).toBeVisible().withTimeout(2000);
					await expect(element(by.text('User has been muted!'))).toBeVisible();
					await element(by.id(`room-members-view-item-${ user }`)).longPress();
					await waitFor(element(by.text('Unmute'))).toBeVisible().withTimeout(2000);
					await expect(element(by.text('Unmute'))).toBeVisible();
					await element(by.text('Unmute')).tap();
					await waitFor(element(by.text('User has been unmuted!'))).toBeVisible().withTimeout(2000);
					await expect(element(by.text('User has been unmuted!'))).toBeVisible();
				});

				afterEach(async() => {
					takeScreenshot();
				});
			});

			// Currently, there's no way to add more owners to the room
			// So we test only for the 'You are the last owner...' message
			it('should tap on leave channel and raise alert', async() => {
				await waitFor(element(by.id('room-actions-leave-channel'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await expect(element(by.id('room-actions-leave-channel'))).toBeVisible();
				await element(by.id('room-actions-leave-channel')).tap();
				await waitFor(element(by.text('Yes, leave it!'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Yes, leave it!'))).toBeVisible();
				await element(by.text('Yes, leave it!')).tap();
				await waitFor(element(by.text('You are the last owner. Please set new owner before leaving the room.'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('You are the last owner. Please set new owner before leaving the room.'))).toBeVisible();
				takeScreenshot();
			});
		})
	});
});
