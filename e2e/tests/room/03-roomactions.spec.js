const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { navigateToLogin, login, tapBack, sleep, searchRoom, mockMessage, starMessage, pinMessage } = require('../../helpers/app');

const scrollDown = 200;

async function navigateToRoomActions(type) {
	let room;
	if (type === 'd') {
		room = 'rocket.cat';
	} else {
		room = data.groups.private.name;
	}
	await searchRoom(room);
	await waitFor(element(by.id(`rooms-list-view-item-${ room }`)).atIndex(0)).toExist().withTimeout(60000);
	await element(by.id(`rooms-list-view-item-${ room }`)).atIndex(0).tap();
	await waitFor(element(by.id('room-view'))).toExist().withTimeout(2000);
	await element(by.id('room-view-header-actions')).tap();
	await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(5000);
}

async function backToActions() {
	await tapBack();
	await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(2000);
}

async function backToRoomsList() {
	await tapBack();
	await waitFor(element(by.id('room-view'))).toExist().withTimeout(2000);
	await tapBack();
	await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(2000);
}

describe('Room actions screen', () => {

	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
	});
	
	describe('Render', async() => {
		describe('Direct', async() => {
			before(async() => {
				await navigateToRoomActions('d');
			});

			it('should have room actions screen', async() => {
				await expect(element(by.id('room-actions-view'))).toExist();
			});
	
			it('should have info', async() => {
				await expect(element(by.id('room-actions-info'))).toExist();
			});
	
			// it('should have voice', async() => {
			// 	await expect(element(by.id('room-actions-voice'))).toExist();
			// });
	
			// it('should have video', async() => {
			// 	await expect(element(by.id('room-actions-video'))).toExist();
			// });
	
			it('should have files', async() => {
				await expect(element(by.id('room-actions-files'))).toExist();
			});
	
			it('should have mentions', async() => {
				await expect(element(by.id('room-actions-mentioned'))).toExist();
			});
	
			it('should have starred', async() => {
				await expect(element(by.id('room-actions-starred'))).toExist();
			});
	
			it('should have search', async() => {
				await expect(element(by.id('room-actions-search'))).toExist();
			});
	
			it('should have share', async() => {
				await waitFor(element(by.id('room-actions-share'))).toExist();
				await expect(element(by.id('room-actions-share'))).toExist();
			});
	
			it('should have pinned', async() => {
				await waitFor(element(by.id('room-actions-pinned'))).toExist();
				await expect(element(by.id('room-actions-pinned'))).toExist();
			});
	
			it('should have notifications', async() => {
				await waitFor(element(by.id('room-actions-notifications'))).toExist();
				await expect(element(by.id('room-actions-notifications'))).toExist();
			});

			it('should have block user', async() => {
				await waitFor(element(by.id('room-actions-block-user'))).toExist();
				await expect(element(by.id('room-actions-block-user'))).toExist();
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
				await expect(element(by.id('room-actions-view'))).toExist();
			});
	
			it('should have info', async() => {
				await expect(element(by.id('room-actions-info'))).toExist();
			});
	
			// it('should have voice', async() => {
			// 	await expect(element(by.id('room-actions-voice'))).toExist();
			// });
	
			// it('should have video', async() => {
			// 	await expect(element(by.id('room-actions-video'))).toExist();
			// });

			it('should have members', async() => {
				await expect(element(by.id('room-actions-members'))).toExist();
			});

			it('should have add user', async() => {
				await expect(element(by.id('room-actions-add-user'))).toExist();
			});
	
			it('should have files', async() => {
				await expect(element(by.id('room-actions-files'))).toExist();
			});
	
			it('should have mentions', async() => {
				await expect(element(by.id('room-actions-mentioned'))).toExist();
			});
	
			it('should have starred', async() => {
				await expect(element(by.id('room-actions-starred'))).toExist();
			});
	
			it('should have search', async() => {
				await expect(element(by.id('room-actions-search'))).toExist();
			});
	
			it('should have share', async() => {
				await waitFor(element(by.id('room-actions-share'))).toExist();
				await expect(element(by.id('room-actions-share'))).toExist();
			});
	
			it('should have pinned', async() => {
				await waitFor(element(by.id('room-actions-pinned'))).toExist();
				await expect(element(by.id('room-actions-pinned'))).toExist();
			});
	
			it('should have notifications', async() => {
				await waitFor(element(by.id('room-actions-notifications'))).toExist();
				await expect(element(by.id('room-actions-notifications'))).toExist();
			});
	
			it('should have leave channel', async() => {
				await waitFor(element(by.id('room-actions-leave-channel'))).toExist();
				await expect(element(by.id('room-actions-leave-channel'))).toExist();
			});
		});
	});

	describe('Usage', async() => {
		describe('TDB', async() => {
			// TODO: test into a jitsi call
			// it('should NOT navigate to voice call', async() => {
			// 	await waitFor(element(by.id('room-actions-voice'))).toExist();
			// 	await element(by.id('room-actions-voice')).tap();
			// 	await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(2000);
			// 	await expect(element(by.id('room-actions-view'))).toExist();
			// });

			// TODO: test into a jitsi call
			// it('should NOT navigate to video call', async() => {
			// 	await element(by.id('room-actions-video')).tap();
			// 	await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(2000);
			// 	await expect(element(by.id('room-actions-view'))).toExist();
			// });

			// TODO: test share room link
			// it('should NOT navigate to share room', async() => {
			// 	await waitFor(element(by.id('room-actions-share'))).toExist();
			// 	await element(by.id('room-actions-share')).tap();
			// 	await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(2000);
			// 	await expect(element(by.id('room-actions-view'))).toExist();
			// });
		});

		describe('Common', async() => {
			it('should show mentioned messages', async() => {
				await element(by.id('room-actions-mentioned')).tap();
				await waitFor(element(by.id('mentioned-messages-view'))).toExist().withTimeout(2000);
				// await waitFor(element(by.text(` ${ data.random }mention`))).toExist().withTimeout(60000);
				await backToActions();
			});

			it('should show starred message and unstar it', async() => {

				//Go back to room and send a message
				await tapBack();
				await mockMessage('messageToStar');

				//Star the message
				await starMessage('messageToStar')

				//Back into Room Actions
				await element(by.id('room-view-header-actions')).tap();
				await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(5000);

				//Go to starred messages
				await element(by.id('room-actions-starred')).tap();
				await waitFor(element(by.id('starred-messages-view'))).toExist().withTimeout(2000);
				await waitFor(element(by.label(`${ data.random }messageToStar`).withAncestor(by.id('starred-messages-view')))).toBeVisible().withTimeout(60000);
				
				//Unstar message
				await element(by.label(`${ data.random }messageToStar`).withAncestor(by.id('starred-messages-view'))).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.label('Unstar')).tap();

				await waitFor(element(by.label(`${ data.random }messageToStar`).withAncestor(by.id('starred-messages-view')))).toBeNotVisible().withTimeout(60000);
				await backToActions();
			});

			it('should show pinned message and unpin it', async() => {

				//Go back to room and send a message
				await tapBack();
				await mockMessage('messageToPin');

				//Pin the message
				await pinMessage('messageToPin')

				//Back into Room Actions
				await element(by.id('room-view-header-actions')).tap();
				await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(5000);
				await element(by.type('UIScrollView')).atIndex(1).scrollTo('bottom');
				await waitFor(element(by.id('room-actions-pinned'))).toExist();
				await element(by.id('room-actions-pinned')).tap();
				await waitFor(element(by.id('pinned-messages-view'))).toExist().withTimeout(2000);
				await waitFor(element(by.label(`${ data.random }messageToPin`).withAncestor(by.id('pinned-messages-view')))).toBeVisible().withTimeout(60000);
				await element(by.label(`${ data.random }messageToPin`).withAncestor(by.id('pinned-messages-view'))).longPress();

				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.label('Unpin')).tap();

				await waitFor(element(by.label(`${ data.random }messageToPin`).withAncestor(by.id('pinned-messages-view')))).toBeNotVisible().withTimeout(60000);
				await backToActions();
			});

			it('should search and find a message', async() => {

				//Go back to room and send a message
				await tapBack();
				await mockMessage('messageToFind');

				//Back into Room Actions
				await element(by.id('room-view-header-actions')).tap();
				await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(5000);

				await element(by.id('room-actions-search')).tap();
				await waitFor(element(by.id('search-messages-view'))).toExist().withTimeout(2000);
				await expect(element(by.id('search-message-view-input'))).toExist();
				await element(by.id('search-message-view-input')).replaceText(`/${ data.random }messageToFind/`);
				await waitFor(element(by.label(`${ data.random }messageToFind`).withAncestor(by.id('search-messages-view')))).toExist().withTimeout(60000);
				await backToActions();
			});
		});

		describe('Notification', async() => {
			it('should navigate to notification preference view', async() => {
				await element(by.type('UIScrollView')).atIndex(1).scrollTo('bottom');
				await waitFor(element(by.id('room-actions-notifications'))).toExist().withTimeout(2000);
				await element(by.id('room-actions-notifications')).tap();
				await waitFor(element(by.id('notification-preference-view'))).toExist().withTimeout(2000);
			});

			it('should have receive notification option', async() => {
				await expect(element(by.id('notification-preference-view-receive-notification'))).toExist();
			});

			it('should have show unread count option', async() => {
				await expect(element(by.id('notification-preference-view-unread-count'))).toExist();
			});

			it('should have notification alert option', async() => {
				await expect(element(by.id('notification-preference-view-alert'))).toExist();
			});

			it('should have push notification option', async() => {
				await waitFor(element(by.id('notification-preference-view-push-notification'))).toExist().withTimeout(4000);
			});

			it('should have notification audio option', async() => {
				await waitFor(element(by.id('notification-preference-view-audio'))).toExist().withTimeout(4000);
			});

			it('should have notification sound option', async() => {
				// Ugly hack to scroll on detox
				await element(by.type('UIScrollView')).atIndex(1).scrollTo('bottom');
				await waitFor(element(by.id('notification-preference-view-sound'))).toExist().withTimeout(4000);
			});

			it('should have notification duration option', async() => {
				await waitFor(element(by.id('notification-preference-view-notification-duration'))).toExist().withTimeout(4000);
			});

			it('should have email alert option', async() => {
				await waitFor(element(by.id('notification-preference-view-email-alert'))).toExist().withTimeout(4000);
			});

			after(async() => {
				await backToActions();
			});
		})

		describe('Channel/Group', async() => {
			// Currently, there's no way to add more owners to the room
			// So we test only for the 'You are the last owner...' message

			const user = data.users.alternate

			it('should tap on leave channel and raise alert', async() => {
				await element(by.type('UIScrollView')).atIndex(1).scrollTo('bottom');
				await waitFor(element(by.id('room-actions-leave-channel'))).toExist().withTimeout(2000);
				await element(by.id('room-actions-leave-channel')).tap();
				await waitFor(element(by.text('Yes, leave it!'))).toExist().withTimeout(2000);
				await element(by.text('Yes, leave it!')).tap();
				await waitFor(element(by.text('You are the last owner. Please set new owner before leaving the room.'))).toExist().withTimeout(8000);
				await element(by.text('OK')).tap();
				await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(2000);
			});

			it('should add user to the room', async() => {
				await waitFor(element(by.id('room-actions-add-user'))).toExist().withTimeout(4000);
				await element(by.id('room-actions-add-user')).tap();
				await waitFor(element(by.id('select-users-view-search'))).toExist().withTimeout(4000);
				await element(by.id('select-users-view-search')).tap();
				await element(by.id('select-users-view-search')).replaceText(user.username);
				await waitFor(element(by.id(`select-users-view-item-${ user.username }`))).toExist().withTimeout(10000);
				await element(by.id(`select-users-view-item-${ user.username }`)).tap();
				await waitFor(element(by.id(`selected-user-${ user.username }`))).toExist().withTimeout(5000);
				await element(by.id('selected-users-view-submit')).tap();
				await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(2000);
				await waitFor(element(by.id('room-actions-members'))).toExist().withTimeout(2000);
				await element(by.id('room-actions-members')).tap();
				await element(by.id('room-members-view-toggle-status')).tap();
				await waitFor(element(by.id(`room-members-view-item-${ user.username }`))).toExist().withTimeout(60000);
				await backToActions(1);
			});

			describe('Room Members', async() => {
				before(async() => {
					await element(by.id('room-actions-members')).tap();
					await waitFor(element(by.id('room-members-view'))).toExist().withTimeout(2000);
				});

				it('should show all users', async() => {
					await element(by.id('room-members-view-toggle-status')).tap();
					await waitFor(element(by.id(`room-members-view-item-${ user.username }`))).toExist().withTimeout(60000);
				});

				it('should filter user', async() => {
					await waitFor(element(by.id(`room-members-view-item-${ user.username }`))).toExist().withTimeout(60000);
					await element(by.id('room-members-view-search')).replaceText('rocket');
					await waitFor(element(by.id(`room-members-view-item-${ user.username }`))).toBeNotVisible().withTimeout(60000);
					await element(by.id('room-members-view-search')).tap();
					await element(by.id('room-members-view-search')).clearText('');
					await waitFor(element(by.id(`room-members-view-item-${ user.username }`))).toExist().withTimeout(60000);
				});

				// FIXME: mute/unmute isn't working
				// it('should mute user', async() => {
				// 	await sleep(1000);
				// 	await element(by.id(`room-members-view-item-${ user.username }`)).longPress(1500);
				// 	await waitFor(element(by.text('Mute'))).toExist().withTimeout(5000);
				// 	await expect(element(by.text('Mute'))).toExist();
				// 	await element(by.text('Mute')).tap();
				// 	await waitFor(element(by.id('toast'))).toExist().withTimeout(10000);
				// 	await expect(element(by.id('toast'))).toExist();
				// 	await waitFor(element(by.id('toast'))).toBeNotVisible().withTimeout(10000);
				// 	await expect(element(by.id('toast'))).toBeNotVisible();
				// 	await element(by.id(`room-members-view-item-${ user.username }`)).longPress(1500);
				// 	await waitFor(element(by.text('Unmute'))).toExist().withTimeout(2000);
				// 	await expect(element(by.text('Unmute'))).toExist();
				// 	await element(by.text('Unmute')).tap();
				// 	await waitFor(element(by.id('toast'))).toExist().withTimeout(10000);
				// 	await expect(element(by.id('toast'))).toExist();
				// 	await waitFor(element(by.id('toast'))).toBeNotVisible().withTimeout(10000);
				// 	await expect(element(by.id('toast'))).toBeNotVisible();
				// });

				it('should navigate to direct room', async() => {
					await waitFor(element(by.id(`room-members-view-item-${ user.username }`))).toExist().withTimeout(5000);
					await element(by.id(`room-members-view-item-${ user.username }`)).tap();
					await waitFor(element(by.id('room-view'))).toExist().withTimeout(60000);
					await waitFor(element(by.id(`room-view-title-${ user.username }`))).toExist().withTimeout(60000);
					await tapBack();
					await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(2000);
				});
			});
		})

		describe('Direct', async() => {
			before(async() => {
				await navigateToRoomActions('d');
			});

			it('should block/unblock user', async() => {
				await waitFor(element(by.id('room-actions-block-user'))).toExist();
				await element(by.id('room-actions-block-user')).tap();
				await waitFor(element(by.label('Unblock user'))).toExist().withTimeout(60000);
				await element(by.id('room-actions-block-user')).tap();
				await waitFor(element(by.label('Block user'))).toExist().withTimeout(60000);
			});
		});
	});
});
