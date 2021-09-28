const data = require('../../data');
const { navigateToLogin, login, tapBack, sleep, searchRoom } = require('../../helpers/app');

async function navigateToRoom(roomName) {
	await searchRoom(`${roomName}`);
	await element(by.id(`rooms-list-view-item-${roomName}`)).tap();
	await waitFor(element(by.id('room-view')))
		.toBeVisible()
		.withTimeout(5000);
}

async function openActionSheet(username) {
	await waitFor(element(by.id(`room-members-view-item-${username}`)))
		.toExist()
		.withTimeout(5000);
	await element(by.id(`room-members-view-item-${username}`)).tap();
	await sleep(300);
	await expect(element(by.id('action-sheet'))).toExist();
	await expect(element(by.id('action-sheet-handle'))).toBeVisible();
}

async function navigateToRoomActions() {
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
async function closeActionSheet() {
	await element(by.id('action-sheet-handle')).swipe('down', 'fast', 0.6);
}

async function waitForToast() {
	await sleep(1000);
}

describe('Team', () => {
	const team = data.teams.private.name;
	const user = data.users.alternate;
	const room = `private${data.random}-channel-team`;
	const existingRoom = data.groups.alternate.name;

	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
		await navigateToRoom(team);
	});

	describe('Team Room', () => {
		describe('Team Header', () => {
			it('should have actions button ', async () => {
				await expect(element(by.id('room-header'))).toExist();
			});

			it('should have team channels button ', async () => {
				await expect(element(by.id('room-view-header-team-channels'))).toExist();
			});

			it('should have threads button ', async () => {
				await expect(element(by.id('room-view-header-threads'))).toExist();
			});

			it('should have threads button ', async () => {
				await expect(element(by.id('room-view-search'))).toExist();
			});
		});

		describe('Team Header Usage', () => {
			it('should navigate to team channels view', async () => {
				await element(by.id('room-view-header-team-channels')).tap();
				await waitFor(element(by.id('team-channels-view')))
					.toExist()
					.withTimeout(5000);
			});
		});

		describe('Team Channels Header', () => {
			it('should have actions button ', async () => {
				await expect(element(by.id('room-header'))).toExist();
			});

			it('should have team channels button ', async () => {
				await expect(element(by.id('team-channels-view-create'))).toExist();
			});

			it('should have threads button ', async () => {
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
				await element(by.id('select-users-view-item-rocket.cat')).tap();
				await waitFor(element(by.id('selected-user-rocket.cat')))
					.toBeVisible()
					.withTimeout(10000);
				await element(by.id('selected-users-view-submit')).tap();

				await waitFor(element(by.id('create-channel-view')))
					.toExist()
					.withTimeout(10000);
				await element(by.id('create-channel-name')).replaceText('');
				await element(by.id('create-channel-name')).typeText(room);
				await element(by.id('create-channel-submit')).tap();

				await waitFor(element(by.id('room-view')))
					.toExist()
					.withTimeout(20000);
				await expect(element(by.id('room-view'))).toExist();
				await expect(element(by.id('room-view-header-team-channels'))).toExist();
				await element(by.id('room-view-header-team-channels')).tap();

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
				await expect(element(by.id('room-view-header-team-channels'))).toExist();
				await expect(element(by.id('room-view-header-threads'))).toExist();
				await expect(element(by.id('room-view-search'))).toExist();
				await tapBack();
			});

			it('should add existing channel to team', async () => {
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

				await waitFor(element(by.id('room-view')))
					.toExist()
					.withTimeout(20000);
				await expect(element(by.id('room-view'))).toExist();
				await expect(element(by.id('room-view-header-team-channels'))).toExist();
				await element(by.id('room-view-header-team-channels')).tap();

				await waitFor(element(by.id(`rooms-list-view-item-${existingRoom}`)))
					.toExist()
					.withTimeout(10000);
			});

			it('should activate/deactivate auto-join to channel', async () => {
				await element(by.id(`rooms-list-view-item-${existingRoom}`))
					.atIndex(0)
					.longPress();

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
				await waitFor(element(by.id(`rooms-list-view-item-${existingRoom}`)))
					.toExist()
					.withTimeout(6000);
			});
		});

		describe('Team actions', () => {
			before(async () => {
				await tapBack();
				await navigateToRoomActions();
			});

			it('should add users to the team', async () => {
				await waitFor(element(by.id('room-actions-add-user')))
					.toExist()
					.withTimeout(10000);
				await element(by.id('room-actions-add-user')).tap();

				const rocketCat = 'rocket.cat';
				await element(by.id('select-users-view-search')).replaceText('rocket.cat');
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
				await element(by.id('select-users-view-search')).replaceText(user.username);
				await waitFor(element(by.id(`select-users-view-item-${user.username}`)))
					.toExist()
					.withTimeout(10000);
				await element(by.id(`select-users-view-item-${user.username}`)).tap();
				await waitFor(element(by.id(`selected-user-${user.username}`)))
					.toExist()
					.withTimeout(5000);

				await element(by.id('selected-users-view-submit')).tap();
				await sleep(300);
				await waitFor(element(by.id('room-actions-members')))
					.toExist()
					.withTimeout(10000);
				await element(by.id('room-actions-members')).tap();
				await element(by.id('room-members-view-toggle-status')).tap();
				await waitFor(element(by.id(`room-members-view-item-${user.username}`)))
					.toExist()
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
					.toExist()
					.withTimeout(2000);
				await element(by.id(`select-list-view-item-${room}`)).tap();

				await waitFor(
					element(
						by.label(
							'You are the last owner of this channel. Once you leave the team, the channel will be kept inside the team but you will be managing it from outside.'
						)
					)
				)
					.toExist()
					.withTimeout(2000);
				await element(by.text('OK')).tap();
				await waitFor(element(by.id('select-list-view-submit')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('select-list-view-submit')).tap();
				await waitFor(element(by.text('Last owner cannot be removed')))
					.toExist()
					.withTimeout(8000);
				await element(by.text('OK')).tap();
				await tapBack();
				await waitFor(element(by.id('room-actions-view')))
					.toExist()
					.withTimeout(2000);
			});

			describe('Room Members', () => {
				before(async () => {
					await element(by.id('room-actions-members')).tap();
					await waitFor(element(by.id('room-members-view')))
						.toExist()
						.withTimeout(2000);
				});

				it('should show all users', async () => {
					await element(by.id('room-members-view-toggle-status')).tap();
					await waitFor(element(by.id(`room-members-view-item-${user.username}`)))
						.toExist()
						.withTimeout(60000);
				});

				it('should filter user', async () => {
					await waitFor(element(by.id(`room-members-view-item-${user.username}`)))
						.toExist()
						.withTimeout(60000);
					await element(by.id('room-members-view-search')).replaceText('rocket');
					await waitFor(element(by.id(`room-members-view-item-${user.username}`)))
						.toBeNotVisible()
						.withTimeout(60000);
					await element(by.id('room-members-view-search')).tap();
					await element(by.id('room-members-view-search')).clearText('');
					await waitFor(element(by.id(`room-members-view-item-${user.username}`)))
						.toExist()
						.withTimeout(60000);
				});

				it('should remove member from team', async () => {
					await openActionSheet('rocket.cat');
					await element(by.id('action-sheet-remove-from-team')).tap();
					await waitFor(element(by.id('select-list-view')))
						.toExist()
						.withTimeout(5000);
					await waitFor(element(by.id(`select-list-view-item-${room}`)))
						.toExist()
						.withTimeout(5000);
					await element(by.id(`select-list-view-item-${room}`)).tap();
					await waitFor(element(by.id(`${room}-checked`)))
						.toExist()
						.withTimeout(5000);
					await element(by.id(`select-list-view-item-${room}`)).tap();
					await waitFor(element(by.id(`${room}-unchecked`)))
						.toExist()
						.withTimeout(5000);
					await element(by.id('select-list-view-submit')).tap();
					await waitFor(element(by.id('room-members-view-item-rocket.cat')))
						.toBeNotVisible()
						.withTimeout(60000);
				});

				it('should set member as owner', async () => {
					await openActionSheet(user.username);
					await element(by.id('action-sheet-set-owner')).tap();
					await waitForToast();

					await openActionSheet(user.username);
					await waitFor(element(by.id('action-sheet-set-owner-checked')))
						.toBeVisible()
						.withTimeout(6000);
					await closeActionSheet();
				});

				it('should leave team', async () => {
					await tapBack();
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
						.toExist()
						.withTimeout(2000);
					await element(by.id(`select-list-view-item-${room}`)).tap();

					await waitFor(
						element(
							by.label(
								'You are the last owner of this channel. Once you leave the team, the channel will be kept inside the team but you will be managing it from outside.'
							)
						)
					)
						.toExist()
						.withTimeout(2000);
					await element(by.text('OK')).tap();
					await waitFor(element(by.id('select-list-view-submit')))
						.toExist()
						.withTimeout(2000);
					await element(by.id('select-list-view-submit')).tap();
					await waitFor(element(by.id(`rooms-list-view-item-${team}`)))
						.toBeNotVisible()
						.withTimeout(60000);
				});
			});
		});
	});
});
