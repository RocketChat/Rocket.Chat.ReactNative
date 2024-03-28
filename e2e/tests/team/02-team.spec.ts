import Detox, { device, waitFor, element, by, expect } from 'detox';

import {
	navigateToLogin,
	login,
	tapBack,
	sleep,
	platformTypes,
	TTextMatcher,
	checkRoomTitle,
	tapAndWaitFor,
	navigateToRoom
} from '../../helpers/app';
import { createRandomRoom, createRandomTeam, createRandomUser, ITestUser } from '../../helpers/data_setup';
import random from '../../helpers/random';

async function openActionSheet(username: string) {
	await waitFor(element(by.id(`room-members-view-item-${username}`)))
		.toBeVisible()
		.withTimeout(5000);
	await tapAndWaitFor(element(by.id(`room-members-view-item-${username}`)), element(by.id('action-sheet')), 2000);
	await expect(element(by.id('action-sheet-handle'))).toBeVisible();
	await element(by.id('action-sheet-handle')).swipe('up');
}

async function navigateToRoomActions() {
	await waitFor(element(by.id('room-view')))
		.toExist()
		.withTimeout(5000);
	await element(by.id('room-header')).atIndex(0).tap();
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
async function closeActionSheet() {
	await element(by.id('action-sheet-handle')).swipe('down', 'fast', 0.6);
	await waitFor(element(by.id('action-sheet-handle')))
		.toBeNotVisible()
		.withTimeout(3000);
	await sleep(200);
}

async function waitForToast() {
	await sleep(1000);
}

async function swipeTillVisible(
	container: Detox.NativeMatcher,
	find: Detox.NativeMatcher,
	direction: Detox.Direction = 'up',
	delta = 0.3,
	speed: Detox.Speed = 'slow'
) {
	let found = false;
	while (!found) {
		try {
			await element(container).swipe(direction, speed, delta);
			await sleep(200);
			await expect(element(find)).toBeVisible();
			found = true;
		} catch (e) {
			//
		}
	}
}

describe('Team', () => {
	const room = `private${random()}-channel-team`;
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	let user: ITestUser;
	let otherUser: ITestUser;
	let team: string;
	let existingRoom: string;

	beforeAll(async () => {
		user = await createRandomUser();
		otherUser = await createRandomUser();
		team = await createRandomTeam(user);
		({ name: existingRoom } = await createRandomRoom(user));
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
		await navigateToRoom(team);
	});

	describe('Team Room', () => {
		describe('Team Header', () => {
			it('should have actions button', async () => {
				await expect(element(by.id('room-header'))).toExist();
			});

			it('should have call button', async () => {
				await expect(element(by.id('room-view-header-call'))).toExist();
			});

			it('should have threads button', async () => {
				await expect(element(by.id('room-view-header-threads'))).toExist();
			});

			it('should have search button', async () => {
				await expect(element(by.id('room-view-search'))).toExist();
			});
		});

		describe('Team Action Usage', () => {
			it('should navigate to team channels view', async () => {
				await element(by.id('room-header')).tap();
				await element(by.id('room-actions-teams')).tap();
				await waitFor(element(by.id('team-channels-view')))
					.toExist()
					.withTimeout(5000);
			});
		});

		describe('Team Channels Header', () => {
			it('should have actions button', async () => {
				await expect(element(by.id('room-header')).atIndex(0)).toExist();
			});

			it('should have team channels button', async () => {
				await expect(element(by.id('team-channels-view-create'))).toExist();
			});

			it('should have threads button', async () => {
				await expect(element(by.id('team-channels-view-search'))).toExist();
			});
		});

		describe('Team Channels Header Usage', () => {
			it('should navigate to add team channels view', async () => {
				await element(by.id('team-channels-view-create')).tap();
				await waitFor(element(by.id('add-channel-team-view')))
					.toExist()
					.withTimeout(5000);
			});

			it('should have create new button', async () => {
				await waitFor(element(by.id('add-channel-team-view-create-channel')))
					.toExist()
					.withTimeout(5000);
			});

			it('should add existing button', async () => {
				await waitFor(element(by.id('add-channel-team-view-add-existing')))
					.toExist()
					.withTimeout(5000);
			});
		});

		describe('Channels', () => {
			it('should create new channel for team', async () => {
				await element(by.id('add-channel-team-view-create-channel')).tap();

				await element(by.id('select-users-view-search')).replaceText('rocket.cat');
				await waitFor(element(by.id('select-users-view-item-rocket.cat')))
					.toBeVisible()
					.withTimeout(5000);
				await element(by.id('select-users-view-item-rocket.cat')).tap();
				await waitFor(element(by.id('selected-user-rocket.cat')))
					.toBeVisible()
					.withTimeout(10000);
				await element(by.id('selected-users-view-submit')).tap();

				await waitFor(element(by.id('create-channel-view')))
					.toExist()
					.withTimeout(10000);
				await element(by.id('create-channel-name')).replaceText(room);
				await element(by.id('create-channel-name')).tapReturnKey();
				await waitFor(element(by.id('create-channel-submit')))
					.toExist()
					.withTimeout(10000);
				await element(by.id('create-channel-submit')).tap();

				await waitFor(element(by.id('room-view')))
					.toExist()
					.withTimeout(20000);
				await expect(element(by.id('room-view'))).toExist();
				await element(by.id('room-header')).tap();
				await expect(element(by.id('room-actions-teams'))).toExist();
				await element(by.id('room-actions-teams')).tap();

				await waitFor(element(by.id('team-channels-view')))
					.toExist()
					.withTimeout(5000);
				await waitFor(element(by.id(`rooms-list-view-item-${room}`)))
					.toExist()
					.withTimeout(6000);
				await expect(element(by.id(`rooms-list-view-item-${room}`))).toExist();
				await element(by.id(`rooms-list-view-item-${room}`)).tap();
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id(`room-view-title-${room}`))).toExist();
				await expect(element(by.id('room-view-header-call')).atIndex(0)).toExist();
				await expect(element(by.id('room-view-header-threads')).atIndex(0)).toExist();
				await expect(element(by.id('room-view-search')).atIndex(0)).toExist();
				await tapBack();
			});

			it('should add existing channel to team', async () => {
				await navigateToRoom(team);
				await element(by.id('room-header')).tap();
				await expect(element(by.id('room-actions-teams'))).toExist();
				await element(by.id('room-actions-teams')).tap();
				await waitFor(element(by.id('team-channels-view')))
					.toExist()
					.withTimeout(5000);
				await element(by.id('team-channels-view-create')).tap();
				await waitFor(element(by.id('add-channel-team-view')))
					.toExist()
					.withTimeout(5000);

				await element(by.id('add-channel-team-view-add-existing')).tap();
				await waitFor(element(by.id('add-existing-channel-view')))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id(`add-existing-channel-view-item-${existingRoom}`))).toExist();
				await element(by.id(`add-existing-channel-view-item-${existingRoom}`)).tap();
				await waitFor(element(by.id('add-existing-channel-view-submit')))
					.toExist()
					.withTimeout(6000);
				await element(by.id('add-existing-channel-view-submit')).tap();
				await checkRoomTitle(team);
				await element(by.id('room-header')).tap();
				await expect(element(by.id('room-actions-teams'))).toExist();
				await element(by.id('room-actions-teams')).tap();
				await waitFor(element(by.id(`rooms-list-view-item-${existingRoom}`)).atIndex(0))
					.toExist()
					.withTimeout(10000);
			});

			it('should activate/deactivate auto-join to channel', async () => {
				await element(by.id(`rooms-list-view-item-${existingRoom}`))
					.atIndex(0)
					.longPress();
				await sleep(500);
				await swipeTillVisible(by.id('action-sheet-remove-from-team'), by.id('action-sheet-delete'));
				await waitFor(element(by.id('action-sheet-auto-join')))
					.toBeVisible()
					.withTimeout(5000);
				await waitFor(element(by.id('auto-join-unchecked')))
					.toBeVisible()
					.withTimeout(5000);
				await waitFor(element(by.id('action-sheet-remove-from-team')))
					.toBeVisible()
					.withTimeout(5000);
				await waitFor(element(by.id('action-sheet-delete')))
					.toBeVisible()
					.withTimeout(5000);

				await element(by.id('auto-join-unchecked')).tap();
				await waitFor(element(by.id('auto-join-tag')))
					.toBeVisible()
					.withTimeout(5000);
				await element(by.id(`rooms-list-view-item-${existingRoom}`))
					.atIndex(0)
					.longPress();

				await waitFor(element(by.id('auto-join-checked')))
					.toBeVisible()
					.withTimeout(5000);
				await element(by.id('auto-join-checked')).tap();
				await waitFor(element(by.id('auto-join-tag')))
					.toBeNotVisible()
					.withTimeout(5000);
				await waitFor(element(by.id(`rooms-list-view-item-${existingRoom}`)).atIndex(0))
					.toExist()
					.withTimeout(6000);
				await tapBack();
			});
		});

		describe('Team actions', () => {
			beforeAll(async () => {
				await tapBack();
				await navigateToRoomActions();
			});

			it('should add users to the team', async () => {
				await element(by.id('room-actions-members')).tap();
				await waitFor(element(by.id('room-members-view')))
					.toBeVisible()
					.withTimeout(2000);

				await waitFor(element(by.id('room-actions-add-user')))
					.toBeVisible()
					.withTimeout(10000);
				await element(by.id('room-actions-add-user')).tap();

				const rocketCat = 'rocket.cat';
				await element(by.id('select-users-view-search')).replaceText('rocket.cat');
				await waitFor(element(by.id(`select-users-view-item-${rocketCat}`)))
					.toBeVisible()
					.withTimeout(10000);
				await element(by.id(`select-users-view-item-${rocketCat}`)).tap();
				await waitFor(element(by.id(`selected-user-${rocketCat}`)))
					.toBeVisible()
					.withTimeout(5000);

				await waitFor(element(by.id('select-users-view-search')))
					.toBeVisible()
					.withTimeout(4000);
				await element(by.id('select-users-view-search')).tap();
				await element(by.id('select-users-view-search')).replaceText(otherUser.username);
				await waitFor(element(by.id(`select-users-view-item-${otherUser.username}`)))
					.toBeVisible()
					.withTimeout(10000);
				await element(by.id(`select-users-view-item-${otherUser.username}`)).tap();
				await waitFor(element(by.id(`selected-user-${otherUser.username}`)))
					.toBeVisible()
					.withTimeout(5000);

				await element(by.id('selected-users-view-submit')).tap();
				await sleep(300);
				await tapBack();
				await sleep(300);
				await waitFor(element(by.id('room-actions-members')))
					.toBeVisible()
					.withTimeout(10000);
				await element(by.id('room-actions-members')).tap();
				await element(by.id('room-members-view-filter')).tap();
				await waitFor(element(by.id('room-members-view-toggle-status-all')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('room-members-view-toggle-status-all')).tap();
				await waitFor(element(by.id(`room-members-view-item-${otherUser.username}`)))
					.toBeVisible()
					.withTimeout(60000);
				await backToActions();
			});

			it('should try to leave to leave team and raise alert', async () => {
				await element(by.id('room-actions-scrollview')).scrollTo('bottom');
				await waitFor(element(by.id('room-actions-leave-channel')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('room-actions-leave-channel')).tap();

				await waitFor(element(by.id('select-list-view')))
					.toExist()
					.withTimeout(2000);
				await waitFor(element(by.id(`select-list-view-item-${room}`)))
					.toExist()
					.withTimeout(2000);
				await waitFor(element(by.id(`select-list-view-item-${existingRoom}`)))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id(`select-list-view-item-${room}`)).tap();

				await waitFor(
					element(
						by[textMatcher](
							'You are the last owner of this channel. Once you leave the team, the channel will be kept inside the team but you will be managing it from outside.'
						)
					)
				)
					.toExist()
					.withTimeout(2000);
				await element(by[textMatcher]('OK').and(by.type(alertButtonType))).tap();
				await waitFor(element(by.id('select-list-view-submit')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('select-list-view-submit')).tap();
				await waitFor(element(by[textMatcher]('Last owner cannot be removed')))
					.toExist()
					.withTimeout(8000);
				await element(by[textMatcher]('OK').and(by.type(alertButtonType))).tap();
				await tapBack();
				await waitFor(element(by.id('room-actions-view')))
					.toBeVisible()
					.withTimeout(2000);
			});

			describe('Room Members', () => {
				beforeAll(async () => {
					await tapAndWaitFor(element(by.id('room-actions-members')), element(by.id('room-members-view')), 10000);
				});

				it('should show all users', async () => {
					await element(by.id('room-members-view-filter')).tap();
					await waitFor(element(by.id('room-members-view-toggle-status-all')))
						.toExist()
						.withTimeout(2000);
					await element(by.id('room-members-view-toggle-status-all')).tap();
					await waitFor(element(by.id(`room-members-view-item-${otherUser.username}`)))
						.toExist()
						.withTimeout(60000);
				});

				it('should filter user', async () => {
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

				it('should remove member from team', async () => {
					await openActionSheet('rocket.cat');
					await waitFor(element(by.id('action-sheet-remove-from-team')))
						.toBeVisible()
						.withTimeout(2000);
					await element(by.id('action-sheet-remove-from-team')).tap();
					await waitFor(element(by.id(`select-list-view-item-${room}`)))
						.toBeVisible()
						.withTimeout(5000);
					await element(by.id(`select-list-view-item-${room}`)).tap();
					await waitFor(element(by.id(`${room}-checked`)))
						.toBeVisible()
						.withTimeout(5000);
					await element(by.id(`select-list-view-item-${room}`)).tap();
					await waitFor(element(by.id(`${room}-checked`)))
						.toNotExist()
						.withTimeout(5000);
					await element(by.id('select-list-view-submit')).tap();
					await waitFor(element(by.id('room-members-view-item-rocket.cat')))
						.toBeNotVisible()
						.withTimeout(60000);
				});

				it('should set member as owner', async () => {
					await openActionSheet(otherUser.username);
					await element(by.id('action-sheet-set-owner')).tap();
					await waitForToast();

					await openActionSheet(otherUser.username);
					await waitFor(element(by.id('action-sheet-set-owner-checked')))
						.toBeVisible()
						.withTimeout(6000);
					await closeActionSheet();
				});

				it('should leave team', async () => {
					await tapBack();
					await waitFor(element(by.id('room-actions-view')))
						.toBeVisible()
						.withTimeout(2000);
					await element(by.id('room-actions-scrollview')).scrollTo('bottom');
					await waitFor(element(by.id('room-actions-leave-channel')))
						.toExist()
						.withTimeout(2000);
					await element(by.id('room-actions-leave-channel')).tap();

					await waitFor(element(by.id('select-list-view')))
						.toExist()
						.withTimeout(2000);
					await waitFor(element(by.id(`select-list-view-item-${room}`)))
						.toExist()
						.withTimeout(2000);
					await waitFor(element(by.id(`select-list-view-item-${existingRoom}`)))
						.toBeVisible()
						.withTimeout(2000);
					await element(by.id(`select-list-view-item-${room}`)).tap();

					await waitFor(
						element(
							by[textMatcher](
								'You are the last owner of this channel. Once you leave the team, the channel will be kept inside the team but you will be managing it from outside.'
							)
						)
					)
						.toExist()
						.withTimeout(2000);
					await element(by[textMatcher]('OK').and(by.type(alertButtonType))).tap();
					await waitFor(element(by.id('select-list-view-submit')))
						.toExist()
						.withTimeout(2000);
					await element(by.id('select-list-view-submit')).tap();
					await waitFor(element(by.id('rooms-list-view')))
						.toBeVisible()
						.withTimeout(10000);
					await waitFor(element(by.id(`rooms-list-view-item-${team}`)))
						.toBeNotVisible()
						.withTimeout(10000);
				});
			});
		});
	});
});
