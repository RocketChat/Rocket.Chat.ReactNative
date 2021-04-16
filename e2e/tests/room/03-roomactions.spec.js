const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { navigateToLogin, login, tapBack, sleep, searchRoom, mockMessage, starMessage, pinMessage } = require('../../helpers/app');
const { sendMessage } = require('../../helpers/data_setup')

async function navigateToRoomActions(type) {
	let room;
	if (type === 'd') {
		room = 'rocket.cat';
	} else {
		room = data.groups.private.name;
	}
	await searchRoom(room);
	await element(by.id(`rooms-list-view-item-${ room }`)).tap();
	await waitFor(element(by.id('room-view'))).toExist().withTimeout(2000);
	await element(by.id('room-header')).tap();
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

async function waitForToast() {
	await sleep(1000);
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
				await element(by.id('room-header')).tap();
				await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(5000);

				//Go to starred messages
				await element(by.id('room-actions-starred')).tap();
				await waitFor(element(by.id('starred-messages-view'))).toExist().withTimeout(2000);
				await waitFor(element(by.label(`${ data.random }messageToStar`).withAncestor(by.id('starred-messages-view')))).toExist().withTimeout(60000);
				
				//Unstar message
				await element(by.label(`${ data.random }messageToStar`)).atIndex(0).longPress();
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
				await element(by.id('room-header')).tap();
				await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(5000);
				await element(by.id('room-actions-scrollview')).scrollTo('bottom');
				await waitFor(element(by.id('room-actions-pinned'))).toExist();
				await element(by.id('room-actions-pinned')).tap();
				await waitFor(element(by.id('pinned-messages-view'))).toExist().withTimeout(2000);
				await waitFor(element(by.label(`${ data.random }messageToPin`).withAncestor(by.id('pinned-messages-view')))).toExist().withTimeout(6000);
				await element(by.label(`${ data.random }messageToPin`).withAncestor(by.id('pinned-messages-view'))).atIndex(0).longPress();

				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.label('Unpin')).tap();

				await waitFor(element(by.label(`${ data.random }messageToPin`).withAncestor(by.id('pinned-messages-view')))).not.toExist().withTimeout(6000);
				await backToActions();
			});

			it('should search and find a message', async() => {

				//Go back to room and send a message
				await tapBack();
				await mockMessage('messageToFind');

				//Back into Room Actions
				await element(by.id('room-header')).tap();
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
				await element(by.id('room-actions-scrollview')).scrollTo('bottom');
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
				await element(by.id('room-actions-scrollview')).scrollTo('bottom');
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
				await element(by.id('room-actions-scrollview')).scrollTo('bottom');
				await waitFor(element(by.id('room-actions-leave-channel'))).toExist().withTimeout(2000);
				await element(by.id('room-actions-leave-channel')).tap();
				await waitFor(element(by.text('Yes, leave it!'))).toExist().withTimeout(2000);
				await element(by.text('Yes, leave it!')).tap();
				await waitFor(element(by.text('You are the last owner. Please set new owner before leaving the room.'))).toExist().withTimeout(8000);
				await element(by.text('OK')).tap();
				await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(2000);
			});

			it('should add users to the room', async() => {
				await waitFor(element(by.id('room-actions-add-user'))).toExist().withTimeout(4000);
				await element(by.id('room-actions-add-user')).tap();

				// add rocket.cat
				const rocketCat = 'rocket.cat';
				await waitFor(element(by.id(`select-users-view-item-${ rocketCat }`))).toExist().withTimeout(10000);
				await element(by.id(`select-users-view-item-${ rocketCat }`)).tap();
				await waitFor(element(by.id(`selected-user-${ rocketCat }`))).toExist().withTimeout(5000);

				await waitFor(element(by.id('select-users-view-search'))).toExist().withTimeout(4000);
				await element(by.id('select-users-view-search')).tap();
				await element(by.id('select-users-view-search')).replaceText(user.username);
				await waitFor(element(by.id(`select-users-view-item-${ user.username }`))).toExist().withTimeout(10000);
				await element(by.id(`select-users-view-item-${ user.username }`)).tap();
				await waitFor(element(by.id(`selected-user-${ user.username }`))).toExist().withTimeout(5000);

				await element(by.id('selected-users-view-submit')).tap();
				await sleep(300);
				await waitFor(element(by.id('room-actions-members'))).toExist().withTimeout(10000);
				await element(by.id('room-actions-members')).tap();
				await element(by.id('room-members-view-toggle-status')).tap();
				await waitFor(element(by.id(`room-members-view-item-${ user.username }`))).toExist().withTimeout(60000);
				await backToActions();
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

				it('should remove user from room', async() => {
					await openActionSheet('rocket.cat');
					await element(by.label('Remove from room')).tap();
					await waitFor(element(by.label('Are you sure?'))).toExist().withTimeout(5000);
					await element(by.label('Yes, remove user!').and(by.type('_UIAlertControllerActionView'))).tap();
					await waitFor(element(by.id('room-members-view-item-rocket.cat'))).toBeNotVisible().withTimeout(60000);
				});

				it('should clear search', async() => {
					await element(by.id('room-members-view-search')).tap();
					await element(by.id('room-members-view-search')).clearText('');
					await waitFor(element(by.id(`room-members-view-item-${ user.username }`))).toExist().withTimeout(60000);
				});

				const openActionSheet = async(username) => {
					await waitFor(element(by.id(`room-members-view-item-${ username }`))).toExist().withTimeout(5000);
					await element(by.id(`room-members-view-item-${ username }`)).tap();
					await sleep(300);
					await expect(element(by.id('action-sheet'))).toExist();
					await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				}

				const closeActionSheet = async() => {
					await element(by.id('action-sheet-handle')).swipe('down', 'fast', 0.6);
				}

				it('should set/remove as owner', async() => {
					await openActionSheet(user.username);
					await element(by.label('Set as owner')).tap();
					await waitForToast();

					await openActionSheet(user.username);
					await element(by.label('Remove as owner')).tap();
					await waitForToast();

					await openActionSheet(user.username);
					// Tests if Remove as owner worked
					await waitFor(element(by.label('Set as owner'))).toExist().withTimeout(5000);
					await closeActionSheet();
				});

				it('should set/remove as leader', async() => {
					await openActionSheet(user.username);
					await element(by.label('Set as leader')).tap();
					await waitForToast();

					await openActionSheet(user.username);
					await element(by.label('Remove as leader')).tap();
					await waitForToast();

					await openActionSheet(user.username);
					// Tests if Remove as leader worked
					await waitFor(element(by.label('Set as leader'))).toExist().withTimeout(5000);
					await closeActionSheet();
				});

				it('should set/remove as moderator', async() => {
					await openActionSheet(user.username);
					await element(by.label('Set as moderator')).tap();
					await waitForToast();

					await openActionSheet(user.username);
					await element(by.label('Remove as moderator')).tap();
					await waitForToast();

					await openActionSheet(user.username);
					// Tests if Remove as moderator worked
					await waitFor(element(by.label('Set as moderator'))).toExist().withTimeout(5000);
					await closeActionSheet();
				});

				it('should set/remove as mute', async() => {
					await openActionSheet(user.username);
					await element(by.label('Mute')).tap();
					await waitFor(element(by.label('Are you sure?'))).toExist().withTimeout(5000);
					await element(by.label('Mute').and(by.type('_UIAlertControllerActionView'))).tap();
					await waitForToast();

					await openActionSheet(user.username);
					await element(by.label('Unmute')).tap();
					await waitFor(element(by.label('Are you sure?'))).toExist().withTimeout(5000);
					await element(by.label('Unmute').and(by.type('_UIAlertControllerActionView'))).tap();
					await waitForToast();

					await openActionSheet(user.username);
					// Tests if Remove as mute worked
					await waitFor(element(by.label('Mute'))).toExist().withTimeout(5000);
					await closeActionSheet();
				});

				it('should ignore user', async() => {
					const message = `${ data.random }ignoredmessagecontent`;
					const channelName = `#${ data.groups.private.name }`;
					await sendMessage(user, channelName, message);
					await openActionSheet(user.username);
					await element(by.label('Ignore')).tap();
					await waitForToast();
					await backToActions();
					await tapBack();
					await waitFor(element(by.id('room-view'))).toExist().withTimeout(60000);
					await waitFor(element(by.label('Message ignored. Tap to display it.')).atIndex(0)).toExist().withTimeout(60000);
					await element(by.label('Message ignored. Tap to display it.')).atIndex(0).tap();
					await waitFor(element(by.label(message)).atIndex(0)).toExist().withTimeout(60000);
					await element(by.label(message)).atIndex(0).tap();
				});

				it('should navigate to direct message', async() => {
					await element(by.id('room-header')).tap();
					await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(5000);
					await element(by.id('room-actions-members')).tap();
					await waitFor(element(by.id('room-members-view'))).toExist().withTimeout(2000);
					await element(by.id('room-members-view-toggle-status')).tap();
					await waitFor(element(by.id(`room-members-view-item-${ user.username }`))).toExist().withTimeout(60000);
					await openActionSheet(user.username);
					await element(by.label('Direct message')).tap();
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
