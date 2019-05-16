const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const data = require('./data');
const { tapBack, sleep } = require('./helpers/app');

const scrollDown = 200;

async function navigateToRoomActions(type) {
	let room;
	if (type === 'd') {
		room = 'rocket.cat';
	} else {
		room = `private${ data.random }`;
	}
	await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
	await element(by.id('rooms-list-view-search')).replaceText(room);
	await sleep(2000);
    await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toExist().withTimeout(60000);
    await element(by.id(`rooms-list-view-item-${ room }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(2000);
	await element(by.id('room-view-header-actions')).tap();
	await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(5000);
}

async function backToActions() {
	await tapBack();
	await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
	await expect(element(by.id('room-actions-view'))).toBeVisible();
}

async function backToRoomsList() {
	await tapBack();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(2000);
	await tapBack();
	await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
}

describe('Room actions screen', () => {
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
	
			it('should have notifications', async() => {
				await waitFor(element(by.id('room-actions-notifications'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await expect(element(by.id('room-actions-notifications'))).toBeVisible();
			});

			it('should have block user', async() => {
				await waitFor(element(by.id('room-actions-block-user'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await expect(element(by.id('room-actions-block-user'))).toBeVisible();
			});

			after(async() => {
				await backToRoomsList();
			});
		});

		describe('Channel/Group', async() => {
			before(async() => {
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
		describe('TDB', async() => {
			it('should NOT navigate to voice call', async() => {
				await waitFor(element(by.id('room-actions-voice'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'up');
				await element(by.id('room-actions-voice')).tap();
				await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('room-actions-view'))).toBeVisible();
			});

			it('should NOT navigate to video call', async() => {
				await element(by.id('room-actions-video')).tap();
				await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('room-actions-view'))).toBeVisible();
			});

			it('should NOT navigate to share messages', async() => {
				await waitFor(element(by.id('room-actions-share'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await element(by.id('room-actions-share')).tap();
				await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('room-actions-view'))).toBeVisible();
			});

			after(async() => {
				takeScreenshot();
			});
		});

		describe('Common', async() => {
			it('should show mentioned messages', async() => {
				await element(by.id('room-actions-mentioned')).tap();
				await waitFor(element(by.id('mentioned-messages-view'))).toExist().withTimeout(2000);
				await expect(element(by.id('mentioned-messages-view'))).toExist();
				// await waitFor(element(by.text(` ${ data.random }mention`))).toBeVisible().withTimeout(60000);
				// await expect(element(by.text(` ${ data.random }mention`))).toBeVisible();
				await backToActions();
			});

			it('should show starred message and unstar it', async() => {
				await element(by.id('room-actions-starred')).tap();
				await waitFor(element(by.id('starred-messages-view'))).toExist().withTimeout(2000);
				await waitFor(element(by.text(`${ data.random }message`).withAncestor(by.id('starred-messages-view')))).toBeVisible().withTimeout(60000);
				await expect(element(by.text(`${ data.random }message`).withAncestor(by.id('starred-messages-view')))).toBeVisible();
				await element(by.text(`${ data.random }message`).withAncestor(by.id('starred-messages-view'))).longPress();
				await waitFor(element(by.text('Unstar'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Unstar'))).toBeVisible();
				await element(by.text('Unstar')).tap();
				await waitFor(element(by.text(`${ data.random }message`).withAncestor(by.id('starred-messages-view')))).toBeNotVisible().withTimeout(60000);
				await expect(element(by.text(`${ data.random }message`).withAncestor(by.id('starred-messages-view')))).toBeNotVisible();
				await backToActions();
			});

			it('should show pinned message and unpin it', async() => {
				await waitFor(element(by.id('room-actions-pinned'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await element(by.id('room-actions-pinned')).tap();
				await waitFor(element(by.id('pinned-messages-view'))).toExist().withTimeout(2000);
				await waitFor(element(by.text(`${ data.random }edited (edited)`).withAncestor(by.id('pinned-messages-view'))).atIndex(0)).toBeVisible().withTimeout(60000);
				await expect(element(by.text(`${ data.random }edited (edited)`).withAncestor(by.id('pinned-messages-view')))).toBeVisible();
				await element(by.text(`${ data.random }edited (edited)`).withAncestor(by.id('pinned-messages-view'))).longPress();
				await waitFor(element(by.text('Unpin'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Unpin'))).toBeVisible();
				await element(by.text('Unpin')).tap();
				await waitFor(element(by.text(`${ data.random }edited (edited)`).withAncestor(by.id('pinned-messages-view'))).atIndex(0)).toBeNotVisible().withTimeout(60000);
				await expect(element(by.text(`${ data.random }edited (edited)`).withAncestor(by.id('pinned-messages-view')))).toBeNotVisible();
				await backToActions();
			});

			it('should search and find a message', async() => {
				await element(by.id('room-actions-search')).tap();
				await waitFor(element(by.id('search-messages-view'))).toExist().withTimeout(2000);
				await expect(element(by.id('search-message-view-input'))).toBeVisible();
				await element(by.id('search-message-view-input')).replaceText(`/${ data.random }message/`);
				await waitFor(element(by.text(`${ data.random }message`).withAncestor(by.id('search-messages-view'))).atIndex(0)).toBeVisible().withTimeout(60000);
				await expect(element(by.text(`${ data.random }message`).withAncestor(by.id('search-messages-view'))).atIndex(0)).toBeVisible();
				await element(by.traits(['button'])).atIndex(0).tap();
				await backToActions();
			});

			it('should enable/disable notifications', async() => {
				await waitFor(element(by.id('room-actions-notifications'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await expect(element(by.text('Disable notifications'))).toBeVisible();
				await element(by.id('room-actions-notifications')).tap();
				await waitFor(element(by.text('Enable notifications'))).toBeVisible().withTimeout(60000);
				await expect(element(by.text('Enable notifications'))).toBeVisible();
				await element(by.id('room-actions-notifications')).tap();
				await waitFor(element(by.text('Disable notifications'))).toBeVisible().withTimeout(60000);
				await expect(element(by.text('Disable notifications'))).toBeVisible();
			});

			afterEach(async() => {
				takeScreenshot();
			});
		});

		describe('Channel/Group', async() => {
			// Currently, there's no way to add more owners to the room
			// So we test only for the 'You are the last owner...' message
			it('should tap on leave channel and raise alert', async() => {
				await waitFor(element(by.id('room-actions-leave-channel'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await expect(element(by.id('room-actions-leave-channel'))).toBeVisible();
				await element(by.id('room-actions-leave-channel')).tap();
				await waitFor(element(by.text('Yes, leave it!'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Yes, leave it!'))).toBeVisible();
				await element(by.text('Yes, leave it!')).tap();
				await waitFor(element(by.text('You are the last owner. Please set new owner before leaving the room.'))).toBeVisible().withTimeout(60000);
				await expect(element(by.text('You are the last owner. Please set new owner before leaving the room.'))).toBeVisible();
				await takeScreenshot();
				await element(by.text('OK')).tap();
				await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
			});

			describe('Add User', async() => {
				it('should add user to the room', async() => {
					await waitFor(element(by.id('room-actions-add-user'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'up');
					await element(by.id('room-actions-add-user')).tap();
					await element(by.id('select-users-view-search')).tap();
					await element(by.id('select-users-view-search')).replaceText(data.alternateUser);
					await waitFor(element(by.id(`select-users-view-item-${ data.alternateUser }`))).toBeVisible().withTimeout(60000);
					await expect(element(by.id(`select-users-view-item-${ data.alternateUser }`))).toBeVisible();
					await element(by.id(`select-users-view-item-${ data.alternateUser }`)).tap();
					await waitFor(element(by.id(`selected-user-${ data.alternateUser }`))).toBeVisible().withTimeout(5000);
					await expect(element(by.id(`selected-user-${ data.alternateUser }`))).toBeVisible();
					await element(by.id('selected-users-view-submit')).tap();
					await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
					await element(by.id('room-actions-members')).tap();
					await element(by.id('room-members-view-toggle-status')).tap();
					await waitFor(element(by.id(`room-members-view-item-${ data.alternateUser }`))).toBeVisible().withTimeout(60000);
					await expect(element(by.id(`room-members-view-item-${ data.alternateUser }`))).toBeVisible();
					await backToActions(1);
				});

				after(async() => {
					takeScreenshot();
				});
			});

			describe('Room Members', async() => {
				before(async() => {
					await element(by.id('room-actions-members')).tap();
					await waitFor(element(by.id('room-members-view'))).toExist().withTimeout(2000);
					await expect(element(by.id('room-members-view'))).toExist();
				});

				it('should show all users', async() => {
					await element(by.id('room-members-view-toggle-status')).tap();
					await waitFor(element(by.id(`room-members-view-item-${ data.alternateUser }`))).toBeVisible().withTimeout(60000);
					await expect(element(by.id(`room-members-view-item-${ data.alternateUser }`))).toBeVisible();
				});

				it('should filter user', async() => {
					await waitFor(element(by.id(`room-members-view-item-${ data.alternateUser }`))).toBeVisible().withTimeout(60000);
					await expect(element(by.id(`room-members-view-item-${ data.alternateUser }`))).toBeVisible();
					await element(by.id('room-members-view-search')).replaceText('rocket');
					await waitFor(element(by.id(`room-members-view-item-${ data.alternateUser }`))).toBeNotVisible().withTimeout(60000);
					await expect(element(by.id(`room-members-view-item-${ data.alternateUser }`))).toBeNotVisible();
					await element(by.id('room-members-view-search')).tap();
					await element(by.id('room-members-view-search')).clearText('');
					await waitFor(element(by.id(`room-members-view-item-${ data.alternateUser }`))).toBeVisible().withTimeout(60000);
					await expect(element(by.id(`room-members-view-item-${ data.alternateUser }`))).toBeVisible();
				});

				it('should mute user', async() => {
					await element(by.id(`room-members-view-item-${ data.alternateUser }`)).longPress();
					await waitFor(element(by.text('Mute'))).toBeVisible().withTimeout(5000);
					await expect(element(by.text('Mute'))).toBeVisible();
					await element(by.text('Mute')).tap();
					await waitFor(element(by.text('User has been muted!'))).toBeVisible().withTimeout(10000);
					// await expect(element(by.text('User has been muted!'))).toBeVisible();
					await waitFor(element(by.text('User has been muted!'))).toBeNotVisible().withTimeout(10000);
					await expect(element(by.text('User has been muted!'))).toBeNotVisible();
					await element(by.id(`room-members-view-item-${ data.alternateUser }`)).longPress();
					await waitFor(element(by.text('Unmute'))).toBeVisible().withTimeout(2000);
					await expect(element(by.text('Unmute'))).toBeVisible();
					await element(by.text('Unmute')).tap();
					await waitFor(element(by.text('User has been unmuted!'))).toBeVisible().withTimeout(10000);
					// await expect(element(by.text('User has been unmuted!'))).toBeVisible();
					await waitFor(element(by.text('User has been unmuted!'))).toBeNotVisible().withTimeout(10000);
					await expect(element(by.text('User has been unmuted!'))).toBeNotVisible();
				});

				it('should navigate to direct room', async() => {
					await waitFor(element(by.id(`room-members-view-item-${ data.alternateUser }`))).toExist().withTimeout(5000);
					await element(by.id(`room-members-view-item-${ data.alternateUser }`)).tap();
					await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(60000);
					await expect(element(by.id('room-view'))).toBeVisible();
					await waitFor(element(by.text(data.alternateUser))).toBeVisible().withTimeout(60000);
					await expect(element(by.text(data.alternateUser))).toBeVisible();
					await tapBack();
					await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				});

				afterEach(async() => {
					takeScreenshot();
				});
			});
		})

		describe('Direct', async() => {
			before(async() => {
				await navigateToRoomActions('d');
			});

			it('should block/unblock user', async() => {
				await waitFor(element(by.id('room-actions-block-user'))).toBeVisible().whileElement(by.id('room-actions-list')).scroll(scrollDown, 'down');
				await element(by.id('room-actions-block-user')).tap();
				await waitFor(element(by.text('Unblock user'))).toBeVisible().withTimeout(60000);
				await expect(element(by.text('Unblock user'))).toBeVisible();
				await element(by.id('room-actions-block-user')).tap();
				await waitFor(element(by.text('Block user'))).toBeVisible().withTimeout(60000);
				await expect(element(by.text('Block user'))).toBeVisible();
			});

			after(async() => {
				takeScreenshot();
			});
		});
	});
});
