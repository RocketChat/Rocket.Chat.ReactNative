import { device, waitFor, element, by, expect } from 'detox';

import {
	navigateToLogin,
	login,
	tapBack,
	sleep,
	searchRoom,
	platformTypes,
	TTextMatcher,
	tapAndWaitFor,
	tryTapping,
	mockMessage
} from '../../helpers/app';
import { createRandomRoom, createRandomUser, ITestUser, post } from '../../helpers/data_setup';
import random from '../../helpers/random';

const { sendMessage } = require('../../helpers/data_setup');

async function starMessage(message: string) {
	const deviceType = device.getPlatform();
	const { textMatcher } = platformTypes[deviceType];
	await waitFor(element(by[textMatcher](message)).atIndex(0)).toExist();
	await tryTapping(element(by[textMatcher](message)).atIndex(0), 2000, true);
	await waitFor(element(by.id('action-sheet')))
		.toExist()
		.withTimeout(2000);
	await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
	await element(by[textMatcher]('Star')).atIndex(0).tap();
	await waitFor(element(by.id('action-sheet')))
		.not.toExist()
		.withTimeout(5000);
}

async function pinMessage(message: string) {
	const deviceType = device.getPlatform();
	const { textMatcher } = platformTypes[deviceType];
	await waitFor(element(by[textMatcher](message)).atIndex(0)).toExist();
	await tryTapping(element(by[textMatcher](message)).atIndex(0), 2000, true);
	await waitFor(element(by.id('action-sheet')))
		.toExist()
		.withTimeout(2000);
	await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
	await element(by[textMatcher]('Pin')).atIndex(0).tap();
	await waitFor(element(by.id('action-sheet')))
		.not.toExist()
		.withTimeout(5000);
}

async function navigateToRoomActions() {
	await searchRoom(room);
	await element(by.id(`rooms-list-view-item-${room}`)).tap();
	await waitFor(element(by.id('room-view')))
		.toExist()
		.withTimeout(2000);
	await element(by.id('room-header')).tap();
	await waitFor(element(by.id('room-actions-view')))
		.toExist()
		.withTimeout(5000);
}

async function backToActions() {
	await tapBack();
	await waitFor(element(by.id('room-actions-view')))
		.toExist()
		.withTimeout(2000);
}

async function waitForToast() {
	await sleep(1000);
}

let user: ITestUser;
let otherUser: ITestUser;
let room: string;

describe('Room actions screen', () => {
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	beforeAll(async () => {
		user = await createRandomUser();
		otherUser = await createRandomUser();
		({ name: room } = await createRandomRoom(user));
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(user.username, user.password);
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
	});

	describe('Render', () => {
		describe('Channel/Group', () => {
			beforeAll(async () => {
				await navigateToRoomActions();
			});

			it('should have room actions screen', async () => {
				await expect(element(by.id('room-actions-view'))).toExist();
			});

			it('should have info', async () => {
				await expect(element(by.id('room-actions-info'))).toExist();
			});

			it('should have members', async () => {
				await expect(element(by.id('room-actions-members'))).toExist();
				await expect(element(by[textMatcher]('1 members'))).toExist();
			});

			it('should have files', async () => {
				await expect(element(by.id('room-actions-files'))).toExist();
			});

			it('should have mentions', async () => {
				await expect(element(by.id('room-actions-mentioned'))).toExist();
			});

			it('should have starred', async () => {
				await expect(element(by.id('room-actions-starred'))).toExist();
			});

			it('should have share', async () => {
				await waitFor(element(by.id('room-actions-share'))).toExist();
				await expect(element(by.id('room-actions-share'))).toExist();
			});

			it('should have pinned', async () => {
				await waitFor(element(by.id('room-actions-pinned'))).toExist();
				await expect(element(by.id('room-actions-pinned'))).toExist();
			});

			it('should have notifications', async () => {
				await waitFor(element(by.id('room-actions-notifications'))).toExist();
				await expect(element(by.id('room-actions-notifications'))).toExist();
			});

			it('should have leave channel', async () => {
				await waitFor(element(by.id('room-actions-leave-channel'))).toExist();
				await expect(element(by.id('room-actions-leave-channel'))).toExist();
			});
		});
	});

	describe('Usage', () => {
		describe('Common', () => {
			it('should show mentioned messages', async () => {
				await element(by.id('room-actions-mentioned')).tap();
				await waitFor(element(by.id('mentioned-messages-view')))
					.toExist()
					.withTimeout(2000);
				await backToActions();
			});

			it('should show starred message and unstar it', async () => {
				// Go back to room and send a message
				await tapBack();
				const messageToStar = await mockMessage('messageToStar');

				// Star the message
				await starMessage(messageToStar);

				// Back into Room Actions
				await element(by.id('room-header')).tap();
				await waitFor(element(by.id('room-actions-view')))
					.toExist()
					.withTimeout(5000);

				// Go to starred messages
				await element(by.id('room-actions-view')).swipe('up');
				await waitFor(element(by.id('room-actions-starred'))).toExist();
				await element(by.id('room-actions-starred')).tap();
				await waitFor(element(by.id('starred-messages-view')))
					.toExist()
					.withTimeout(2000);
				await waitFor(element(by[textMatcher](messageToStar).withAncestor(by.id('starred-messages-view'))))
					.toExist()
					.withTimeout(60000);

				// Unstar message
				await element(by[textMatcher](messageToStar)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by[textMatcher]('Unstar')).atIndex(0).tap();

				await waitFor(element(by[textMatcher](messageToStar).withAncestor(by.id('starred-messages-view'))))
					.toBeNotVisible()
					.withTimeout(60000);
				await backToActions();
			});

			it('should show pinned message and unpin it', async () => {
				// Go back to room and send a message
				await tapBack();
				const messageToPin = await mockMessage('messageToPin');

				// Pin the message
				await pinMessage(messageToPin);
				// verify pin icon
				await waitFor(element(by.id(`${messageToPin}-pinned`)))
					.toExist()
					.withTimeout(6000);
				// Back into Room Actions
				await element(by.id('room-header')).tap();
				await waitFor(element(by.id('room-actions-view')))
					.toExist()
					.withTimeout(5000);
				await element(by.id('room-actions-scrollview')).scrollTo('bottom');
				await waitFor(element(by.id('room-actions-pinned'))).toExist();
				await element(by.id('room-actions-pinned')).tap();
				await waitFor(element(by.id('pinned-messages-view')))
					.toExist()
					.withTimeout(2000);
				await waitFor(element(by[textMatcher](messageToPin).withAncestor(by.id('pinned-messages-view'))))
					.toExist()
					.withTimeout(6000);
				await element(by[textMatcher](messageToPin).withAncestor(by.id('pinned-messages-view')))
					.atIndex(0)
					.longPress();

				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by[textMatcher]('Unpin')).atIndex(0).tap();

				await waitFor(element(by[textMatcher](messageToPin).withAncestor(by.id('pinned-messages-view'))))
					.not.toExist()
					.withTimeout(6000);
				// verify pin icon
				await waitFor(element(by.id(`${messageToPin}-pinned`)))
					.not.toExist()
					.withTimeout(6000);
				await backToActions();
			});
		});

		describe('Notification', () => {
			it('should navigate to notification preference view', async () => {
				await waitFor(element(by.id('room-actions-scrollview')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('room-actions-scrollview')).scrollTo('bottom');
				await waitFor(element(by.id('room-actions-notifications')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('room-actions-notifications')).tap();
				await waitFor(element(by.id('notification-preference-view')))
					.toExist()
					.withTimeout(2000);
			});

			it('should have receive notification option', async () => {
				await expect(element(by.id('notification-preference-view-receive-notification'))).toExist();
			});

			it('should have show unread count option', async () => {
				await expect(element(by.id('notification-preference-view-mark-as-unread'))).toExist();
			});

			it('should have notification alert option', async () => {
				await expect(element(by.id('notification-preference-view-alert'))).toExist();
			});

			it('should have push notification option', async () => {
				await waitFor(element(by.id('notification-preference-view-push-notification')))
					.toExist()
					.withTimeout(4000);
			});

			it('should have notification sound option', async () => {
				await waitFor(element(by.id('notification-preference-view-sound')))
					.toExist()
					.withTimeout(4000);
			});

			it('should have email alert option', async () => {
				await waitFor(element(by.id('notification-preference-view-email-alert')))
					.toExist()
					.withTimeout(4000);
			});

			afterAll(async () => {
				await backToActions();
			});
		});

		describe('Channel/Group', () => {
			it('should tap on leave channel and raise alert', async () => {
				await waitFor(element(by.id('room-actions-scrollview')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('room-actions-scrollview')).scrollTo('bottom');
				await waitFor(element(by.id('room-actions-leave-channel')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('room-actions-leave-channel')).tap();
				await waitFor(element(by[textMatcher]('Yes, leave it!')))
					.toExist()
					.withTimeout(2000);
				await element(by[textMatcher]('Yes, leave it!').and(by.type(alertButtonType))).tap();
				await waitFor(element(by[textMatcher]('You are the last owner. Please set new owner before leaving the room.')))
					.toExist()
					.withTimeout(8000);
				await element(by[textMatcher]('OK').and(by.type(alertButtonType))).tap();
				await waitFor(element(by.id('room-actions-view')))
					.toExist()
					.withTimeout(2000);
			});

			it('should add users to the room', async () => {
				await waitFor(element(by.id('room-actions-members')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('room-actions-members')).tap();
				await waitFor(element(by.id('room-members-view')))
					.toExist()
					.withTimeout(2000);

				await waitFor(element(by.id('room-actions-add-user')))
					.toExist()
					.withTimeout(4000);
				await element(by.id('room-actions-add-user')).tap();

				// add rocket.cat
				const rocketCat = 'rocket.cat';
				await post('im.create', { username: rocketCat }, user);
				await waitFor(element(by.id(`select-users-view-item-${rocketCat}`)))
					.toExist()
					.withTimeout(10000);
				await element(by.id(`select-users-view-item-${rocketCat}`)).tap();
				await waitFor(element(by.id(`selected-user-${rocketCat}`)))
					.toExist()
					.withTimeout(5000);

				await waitFor(element(by.id('select-users-view-search')))
					.toExist()
					.withTimeout(4000);
				await element(by.id('select-users-view-search')).tap();
				await element(by.id('select-users-view-search')).replaceText(otherUser.username);
				await sleep(300);
				await waitFor(element(by.id(`select-users-view-item-${otherUser.username}`)))
					.toExist()
					.withTimeout(10000);
				await element(by.id(`select-users-view-item-${otherUser.username}`)).tap();
				await waitFor(element(by.id(`selected-user-${otherUser.username}`)))
					.toExist()
					.withTimeout(5000);

				await element(by.id('selected-users-view-submit')).tap();
				await sleep(300);
				await backToActions();
				await waitFor(element(by[textMatcher]('3 members')))
					.toExist()
					.withTimeout(5000);
			});

			describe('Room Members', () => {
				beforeAll(async () => {
					await waitFor(element(by.id('room-actions-members')))
						.toExist()
						.withTimeout(2000);
					await sleep(300); // wait for animation
					await tapAndWaitFor(element(by.id('room-actions-members')), element(by.id('room-members-view')), 2000);
				});

				const openActionSheet = async (username: string) => {
					await waitFor(element(by.id(`room-members-view-item-${username}`)))
						.toExist()
						.withTimeout(5000);
					let n = 0;
					while (n < 3) {
						// Max tries three times, in case it does not register the click
						try {
							await element(by.id(`room-members-view-item-${username}`)).tap();
							await sleep(300);
							await waitFor(element(by.id('action-sheet')))
								.toExist()
								.withTimeout(5000);
							await expect(element(by.id('action-sheet-handle'))).toBeVisible();
							await element(by.id('action-sheet-handle')).swipe('up');
							return;
						} catch (e) {
							n += 1;
						}
					}
				};

				const closeActionSheet = async () => {
					await element(by.id('action-sheet-handle')).swipe('down', 'fast', 0.6);
					await waitFor(element(by.id('action-sheet')))
						.toBeNotVisible()
						.withTimeout(1000);
					await sleep(100);
				};

				it('should show all users', async () => {
					await waitFor(element(by.id('room-members-view-filter')))
						.toExist()
						.withTimeout(10000);
					await element(by.id('room-members-view-filter')).tap();
					await waitFor(element(by.id('room-members-view-toggle-status-all')))
						.toExist()
						.withTimeout(2000);
					await element(by.id('room-members-view-toggle-status-all')).tap();
					await waitFor(element(by.id(`room-members-view-item-${otherUser.username}`)))
						.toExist()
						.withTimeout(60000);
					await tapBack();
				});

				it('should filter user', async () => {
					await waitFor(element(by.id('room-actions-members')))
						.toExist()
						.withTimeout(2000);
					await element(by.id('room-actions-members')).tap();
					await element(by.id('room-members-view-filter')).tap();
					await waitFor(element(by.id('room-members-view-toggle-status-all')))
						.toExist()
						.withTimeout(2000);
					await element(by.id('room-members-view-toggle-status-all')).tap();
					await waitFor(element(by.id(`room-members-view-item-${otherUser.username}`)))
						.toExist()
						.withTimeout(60000);
					await element(by.id('room-members-view-search')).replaceText('rocket');
					await waitFor(element(by.id(`room-members-view-item-${otherUser.username}`)))
						.toBeNotVisible()
						.withTimeout(60000);
					await element(by.id('room-members-view-search')).tap();
					await element(by.id('room-members-view-search')).clearText();
					await waitFor(element(by.id(`room-members-view-item-${otherUser.username}`)))
						.toExist()
						.withTimeout(60000);
				});

				it('should remove user from room', async () => {
					await openActionSheet('rocket.cat');
					await waitFor(element(by[textMatcher]('Remove from room')))
						.toExist()
						.withTimeout(2000);
					await element(by[textMatcher]('Remove from room')).atIndex(0).tap();
					await waitFor(element(by[textMatcher]('Are you sure?')))
						.toExist()
						.withTimeout(5000);
					await element(by[textMatcher]('Yes, remove user!').and(by.type(alertButtonType))).tap();
					await waitFor(element(by.id('room-members-view-item-rocket.cat')))
						.toBeNotVisible()
						.withTimeout(60000);
				});

				it('should clear search', async () => {
					await element(by.id('room-members-view-search')).tap();
					await element(by.id('room-members-view-search')).clearText();
					await waitFor(element(by.id(`room-members-view-item-${otherUser.username}`)))
						.toExist()
						.withTimeout(60000);
				});

				it('should set/remove as owner', async () => {
					await openActionSheet(otherUser.username);
					await element(by.id('action-sheet-set-owner')).tap();
					await waitForToast();

					await openActionSheet(otherUser.username);
					await waitFor(element(by.id('action-sheet-set-owner-checked')))
						.toBeVisible()
						.withTimeout(6000);
					await element(by.id('action-sheet-set-owner')).tap();
					await waitForToast();

					await openActionSheet(otherUser.username);
					await waitFor(element(by.id('action-sheet-set-owner-unchecked')))
						.toBeVisible()
						.withTimeout(60000);
					await closeActionSheet();
				});

				it('should set/remove as leader', async () => {
					await openActionSheet(otherUser.username);
					await element(by.id('action-sheet-set-leader')).tap();
					await waitForToast();

					await openActionSheet(otherUser.username);
					await waitFor(element(by.id('action-sheet-set-leader-checked')))
						.toBeVisible()
						.withTimeout(6000);
					await element(by.id('action-sheet-set-leader')).tap();
					await waitForToast();

					await openActionSheet(otherUser.username);
					await waitFor(element(by.id('action-sheet-set-owner-unchecked')))
						.toBeVisible()
						.withTimeout(60000);
					await closeActionSheet();
				});

				it('should set/remove as moderator', async () => {
					await openActionSheet(otherUser.username);
					await element(by.id('action-sheet-set-moderator')).tap();
					await waitForToast();

					await openActionSheet(otherUser.username);
					await waitFor(element(by.id('action-sheet-set-moderator-checked')))
						.toBeVisible()
						.withTimeout(6000);
					await element(by.id('action-sheet-set-moderator')).tap();
					await waitForToast();

					await openActionSheet(otherUser.username);
					await waitFor(element(by.id('action-sheet-set-moderator-unchecked')))
						.toBeVisible()
						.withTimeout(60000);
					await closeActionSheet();
				});

				it('should set/remove as mute', async () => {
					await openActionSheet(otherUser.username);
					await element(by[textMatcher]('Disable writing in room')).atIndex(0).tap();
					await waitFor(element(by[textMatcher]('Are you sure?')))
						.toExist()
						.withTimeout(5000);
					await element(by[textMatcher]('Disable writing in room').and(by.type(alertButtonType))).tap();
					await waitForToast();

					await openActionSheet(otherUser.username);
					await element(by[textMatcher]('Enable writing in room')).atIndex(0).tap();
					await waitFor(element(by[textMatcher]('Are you sure?')))
						.toExist()
						.withTimeout(5000);
					await element(by[textMatcher]('Enable writing in room').and(by.type(alertButtonType))).tap();
					await waitForToast();

					await openActionSheet(otherUser.username);
					// Tests if Remove as mute worked
					await waitFor(element(by[textMatcher]('Disable writing in room')))
						.toExist()
						.withTimeout(5000);
					await closeActionSheet();
				});

				it('should ignore user', async () => {
					const message = `${random()}ignoredmessagecontent`;
					await sendMessage(otherUser, room, message);
					await openActionSheet(otherUser.username);
					await element(by[textMatcher]('Ignore')).atIndex(0).tap();
					await waitForToast();
					await backToActions();
					await tapBack();
					await waitFor(element(by.id('room-view')))
						.toExist()
						.withTimeout(60000);
					await waitFor(element(by[textMatcher]('Message ignored. Tap to display it.')).atIndex(0))
						.toExist()
						.withTimeout(60000);
					await tapAndWaitFor(
						element(by[textMatcher]('Message ignored. Tap to display it.')).atIndex(0),
						element(by[textMatcher](message)).atIndex(0),
						2000
					);
					await element(by[textMatcher](message)).atIndex(0).tap();
				});

				it('should navigate to direct message', async () => {
					await element(by.id('room-header')).tap();
					await waitFor(element(by.id('room-actions-view')))
						.toExist()
						.withTimeout(5000);
					await waitFor(element(by.id('room-actions-members')))
						.toExist()
						.withTimeout(2000);
					await element(by.id('room-actions-members')).tap();
					await waitFor(element(by.id('room-members-view')))
						.toExist()
						.withTimeout(2000);
					await waitFor(element(by.id('room-members-view-filter')))
						.toExist()
						.withTimeout(10000);
					await element(by.id('room-members-view-filter')).tap();
					await waitFor(element(by.id('room-members-view-toggle-status-all')))
						.toExist()
						.withTimeout(2000);
					await element(by.id('room-members-view-toggle-status-all')).tap();
					await waitFor(element(by.id(`room-members-view-item-${otherUser.username}`)))
						.toExist()
						.withTimeout(60000);
					await openActionSheet(otherUser.username);
					await element(by[textMatcher]('Direct message')).atIndex(0).tap();
					await waitFor(element(by.id('room-view')))
						.toExist()
						.withTimeout(60000);
					await waitFor(element(by.id(`room-view-title-${otherUser.username}`)))
						.toExist()
						.withTimeout(60000);
					await tapBack();
					await waitFor(element(by.id('rooms-list-view')))
						.toExist()
						.withTimeout(2000);
				});
			});
		});
	});
});
