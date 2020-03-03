const {
	device, expect, element, by, waitFor
} = require('detox');
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
	await element(by.type('UIScrollView')).atIndex(1).scrollTo('top');
	await element(by.id('rooms-list-view-search')).typeText(room);
	await sleep(2000);
	await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toExist().withTimeout(60000);
	await element(by.id(`rooms-list-view-item-${ room }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(2000);
	await sleep(1000);
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
	
			// it('should have voice', async() => {
			// 	await expect(element(by.id('room-actions-voice'))).toBeVisible();
			// });
	
			// it('should have video', async() => {
			// 	await expect(element(by.id('room-actions-video'))).toBeVisible();
			// });
	
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
				await waitFor(element(by.id('room-actions-share'))).toBeVisible();
				await expect(element(by.id('room-actions-share'))).toBeVisible();
			});
	
			it('should have pinned', async() => {
				await waitFor(element(by.id('room-actions-pinned'))).toBeVisible();
				await expect(element(by.id('room-actions-pinned'))).toBeVisible();
			});
	
			it('should have notifications', async() => {
				await waitFor(element(by.id('room-actions-notifications'))).toBeVisible();
				await expect(element(by.id('room-actions-notifications'))).toBeVisible();
			});

			it('should have block user', async() => {
				await waitFor(element(by.id('room-actions-block-user'))).toBeVisible();
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
	
			// it('should have voice', async() => {
			// 	await expect(element(by.id('room-actions-voice'))).toBeVisible();
			// });
	
			// it('should have video', async() => {
			// 	await expect(element(by.id('room-actions-video'))).toBeVisible();
			// });

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
				await waitFor(element(by.id('room-actions-share'))).toBeVisible();
				await expect(element(by.id('room-actions-share'))).toBeVisible();
			});
	
			it('should have pinned', async() => {
				await waitFor(element(by.id('room-actions-pinned'))).toBeVisible();
				await expect(element(by.id('room-actions-pinned'))).toBeVisible();
			});
	
			it('should have notifications', async() => {
				await waitFor(element(by.id('room-actions-notifications'))).toBeVisible();
				await expect(element(by.id('room-actions-notifications'))).toBeVisible();
			});
	
			it('should have leave channel', async() => {
				await waitFor(element(by.id('room-actions-leave-channel'))).toBeVisible();
				await expect(element(by.id('room-actions-leave-channel'))).toBeVisible();
			});
		});
	});

	describe('Usage', async() => {
		describe('TDB', async() => {
			// TODO: test into a jitsi call
			// it('should NOT navigate to voice call', async() => {
			// 	await waitFor(element(by.id('room-actions-voice'))).toBeVisible();
			// 	await element(by.id('room-actions-voice')).tap();
			// 	await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
			// 	await expect(element(by.id('room-actions-view'))).toBeVisible();
			// });

			// TODO: test into a jitsi call
			// it('should NOT navigate to video call', async() => {
			// 	await element(by.id('room-actions-video')).tap();
			// 	await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
			// 	await expect(element(by.id('room-actions-view'))).toBeVisible();
			// });

			// TODO: test share room link
			// it('should NOT navigate to share room', async() => {
			// 	await waitFor(element(by.id('room-actions-share'))).toBeVisible();
			// 	await element(by.id('room-actions-share')).tap();
			// 	await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
			// 	await expect(element(by.id('room-actions-view'))).toBeVisible();
			// });
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
				await sleep(1000);
				await waitFor(element(by.label(`${ data.random }message`)).atIndex(0)).toBeVisible().withTimeout(60000);
				await expect(element(by.label(`${ data.random }message`)).atIndex(0)).toBeVisible();
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await waitFor(element(by.text('Unstar'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Unstar'))).toBeVisible();
				await element(by.text('Unstar')).tap();
				await waitFor(element(by.label(`${ data.random }message`))).toBeNotVisible().withTimeout(60000);
				await expect(element(by.label(`${ data.random }message`))).toBeNotVisible();
				await backToActions();
			});

			it('should show pinned message and unpin it', async() => {
				await waitFor(element(by.id('room-actions-pinned'))).toBeVisible();
				await element(by.id('room-actions-pinned')).tap();
				await waitFor(element(by.id('pinned-messages-view'))).toExist().withTimeout(2000);
				await sleep(1000);
				await waitFor(element(by.label(`${ data.random }edited (edited)`)).atIndex(0)).toBeVisible().withTimeout(60000);
				await expect(element(by.label(`${ data.random }edited (edited)`)).atIndex(0)).toBeVisible();
				await element(by.label(`${ data.random }edited (edited)`)).atIndex(0).longPress();
				await waitFor(element(by.text('Unpin'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Unpin'))).toBeVisible();
				await element(by.text('Unpin')).tap();
				await waitFor(element(by.label(`${ data.random }edited (edited)`)).atIndex(0)).toBeNotVisible().withTimeout(60000);
				await expect(element(by.label(`${ data.random }edited (edited)`))).toBeNotVisible();
				await backToActions();
			});

			it('should search and find a message', async() => {
				await element(by.id('room-actions-search')).tap();
				await waitFor(element(by.id('search-messages-view'))).toExist().withTimeout(2000);
				await expect(element(by.id('search-message-view-input'))).toBeVisible();
				await element(by.id('search-message-view-input')).replaceText(`/${ data.random }message/`);
				await waitFor(element(by.label(`${ data.random }message`)).atIndex(0)).toBeVisible().withTimeout(60000);
				await expect(element(by.label(`${ data.random }message`)).atIndex(0)).toBeVisible();
				await backToActions();
			});
		});

		describe('Notification', async() => {
			it('should navigate to notification preference view', async() => {
				await waitFor(element(by.id('room-actions-notifications'))).toBeVisible();
				await expect(element(by.id('room-actions-notifications'))).toBeVisible();
				await element(by.id('room-actions-notifications')).tap();
				await waitFor(element(by.id('notification-preference-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('notification-preference-view'))).toBeVisible();
			});

			it('should have receive notification option', async() => {
				await expect(element(by.id('notification-preference-view-receive-notification'))).toBeVisible();
			});

			it('should have show unread count option', async() => {
				await expect(element(by.id('notification-preference-view-unread-count'))).toBeVisible();
			});

			it('should have notification alert option', async() => {
				await expect(element(by.id('notification-preference-view-alert'))).toBeVisible();
			});

			it('should have push notification option', async() => {
				await waitFor(element(by.id('notification-preference-view-push-notification'))).toBeVisible();
				await expect(element(by.id('notification-preference-view-push-notification'))).toBeVisible();
			});

			it('should have notification audio option', async() => {
				await waitFor(element(by.id('notification-preference-view-audio'))).toBeVisible();
				await expect(element(by.id('notification-preference-view-audio'))).toBeVisible();
			});

			it('should have notification sound option', async() => {
				// Ugly hack to scroll on detox
				await element(by.type('UIScrollView')).atIndex(1).scrollTo('bottom');
				await waitFor(element(by.id('notification-preference-view-sound'))).toBeVisible();
				await expect(element(by.id('notification-preference-view-sound'))).toBeVisible();
			});

			it('should have notification duration option', async() => {
				await waitFor(element(by.id('notification-preference-view-notification-duration'))).toBeVisible();
				await expect(element(by.id('notification-preference-view-notification-duration'))).toBeVisible();
			});

			it('should have email alert option', async() => {
				await waitFor(element(by.id('notification-preference-view-email-alert'))).toBeVisible();
				await expect(element(by.id('notification-preference-view-email-alert'))).toBeVisible();
			});

			after(async() => {
				await backToActions();
			});
		})

		describe('Channel/Group', async() => {
			// Currently, there's no way to add more owners to the room
			// So we test only for the 'You are the last owner...' message
			it('should tap on leave channel and raise alert', async() => {
				await waitFor(element(by.id('room-actions-leave-channel'))).toBeVisible();
				await expect(element(by.id('room-actions-leave-channel'))).toBeVisible();
				await element(by.id('room-actions-leave-channel')).tap();
				await waitFor(element(by.text('Yes, leave it!'))).toBeVisible().withTimeout(2000);
				await expect(element(by.text('Yes, leave it!'))).toBeVisible();
				await element(by.text('Yes, leave it!')).tap();
				await waitFor(element(by.text('You are the last owner. Please set new owner before leaving the room.'))).toBeVisible().withTimeout(60000);
				await expect(element(by.text('You are the last owner. Please set new owner before leaving the room.'))).toBeVisible();
				await element(by.text('OK')).tap();
				await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
			});

			it('should add user to the room', async() => {
				await waitFor(element(by.id('room-actions-add-user'))).toBeVisible();
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

			describe('Room Members', async() => {
				before(async() => {
					await element(by.id('room-actions-members')).tap();
					await waitFor(element(by.id('room-members-view'))).toExist().withTimeout(2000);
					await expect(element(by.id('room-members-view'))).toExist();
				});

				it('should show all users', async() => {
					await sleep(1000);
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

				// FIXME: mute/unmute isn't working
				// it('should mute user', async() => {
				// 	await sleep(1000);
				// 	await element(by.id(`room-members-view-item-${ data.alternateUser }`)).longPress(1500);
				// 	await waitFor(element(by.text('Mute'))).toBeVisible().withTimeout(5000);
				// 	await expect(element(by.text('Mute'))).toBeVisible();
				// 	await element(by.text('Mute')).tap();
				// 	await waitFor(element(by.id('toast'))).toBeVisible().withTimeout(10000);
				// 	await expect(element(by.id('toast'))).toBeVisible();
				// 	await waitFor(element(by.id('toast'))).toBeNotVisible().withTimeout(10000);
				// 	await expect(element(by.id('toast'))).toBeNotVisible();
				// 	await element(by.id(`room-members-view-item-${ data.alternateUser }`)).longPress(1500);
				// 	await waitFor(element(by.text('Unmute'))).toBeVisible().withTimeout(2000);
				// 	await expect(element(by.text('Unmute'))).toBeVisible();
				// 	await element(by.text('Unmute')).tap();
				// 	await waitFor(element(by.id('toast'))).toBeVisible().withTimeout(10000);
				// 	await expect(element(by.id('toast'))).toBeVisible();
				// 	await waitFor(element(by.id('toast'))).toBeNotVisible().withTimeout(10000);
				// 	await expect(element(by.id('toast'))).toBeNotVisible();
				// });

				it('should navigate to direct room', async() => {
					await waitFor(element(by.id(`room-members-view-item-${ data.alternateUser }`))).toExist().withTimeout(5000);
					await element(by.id(`room-members-view-item-${ data.alternateUser }`)).tap();
					await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(60000);
					await expect(element(by.id('room-view'))).toBeVisible();
					await waitFor(element(by.id(`room-view-title-${ data.alternateUser }`))).toBeVisible().withTimeout(60000);
					await expect(element(by.id(`room-view-title-${ data.alternateUser }`))).toBeVisible();
					await tapBack();
					await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				});
			});
		})

		describe('Direct', async() => {
			before(async() => {
				await navigateToRoomActions('d');
			});

			it('should block/unblock user', async() => {
				await waitFor(element(by.id('room-actions-block-user'))).toBeVisible();
				await sleep(1000);
				await element(by.id('room-actions-block-user')).tap();
				await waitFor(element(by.label('Unblock user'))).toBeVisible().withTimeout(60000);
				await expect(element(by.label('Unblock user'))).toBeVisible();
				await element(by.id('room-actions-block-user')).tap();
				await waitFor(element(by.label('Block user'))).toBeVisible().withTimeout(60000);
				await expect(element(by.label('Block user'))).toBeVisible();
			});
		});
	});
});
