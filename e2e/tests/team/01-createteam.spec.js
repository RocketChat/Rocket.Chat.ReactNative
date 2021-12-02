const data = require('../../data');
const { navigateToLogin, login, platformTypes } = require('../../helpers/app');

const teamName = `team-${data.random}`;

describe('Create team screen', () => {
	let alertButtonType;
	let textMatcher;
	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
	});

	describe('New Message', () => {
		before(async () => {
			await element(by.id('rooms-list-view-create-channel')).tap();
		});

		it('should have team button', async () => {
			await waitFor(element(by.id('new-message-view-create-team')))
				.toBeVisible()
				.withTimeout(2000);
		});

		it('should navigate to select users', async () => {
			await element(by.id('new-message-view-create-team')).tap();
			await waitFor(element(by.id('select-users-view')))
				.toExist()
				.withTimeout(5000);
		});
	});

	describe('Select Users', () => {
		it('should nav to create team', async () => {
			await element(by.id('selected-users-view-submit')).tap();
			await waitFor(element(by.id('create-channel-view')))
				.toExist()
				.withTimeout(10000);
		});
	});

	describe('Create Team', () => {
		describe('Usage', () => {
			it('should get invalid team name', async () => {
				await element(by.id('create-channel-name')).replaceText(`${data.teams.private.name}`);
				await waitFor(element(by.id('create-channel-submit')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by[textMatcher]('OK').and(by.type(alertButtonType))))
					.toBeVisible()
					.withTimeout(5000);
				await element(by[textMatcher]('OK').and(by.type(alertButtonType))).tap();
			});

			it('should create private team', async () => {
				await element(by.id('create-channel-name')).replaceText('');
				await element(by.id('create-channel-name')).replaceText(teamName);
				await waitFor(element(by.id('create-channel-submit')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view')))
					.toExist()
					.withTimeout(20000);
				await expect(element(by.id('room-view'))).toExist();
				await waitFor(element(by.id(`room-view-title-${teamName}`)))
					.toExist()
					.withTimeout(6000);
				await expect(element(by.id(`room-view-title-${teamName}`))).toExist();
			});
		});
	});

	describe('Delete Team', () => {
		it('should navigate to room info edit view', async () => {
			await element(by.id('room-header')).tap();
			await waitFor(element(by.id('room-actions-view')))
				.toExist()
				.withTimeout(5000);
			await element(by.id('room-actions-info')).tap();
			await waitFor(element(by.id('room-info-view')))
				.toExist()
				.withTimeout(2000);
		});

		it('should delete team', async () => {
			await element(by.id('room-info-view-edit-button')).tap();
			await element(by.id('room-info-edit-view-list')).swipe('up', 'fast', 0.5);
			await element(by.id('room-info-edit-view-delete')).tap();
			await waitFor(element(by[textMatcher]('Yes, delete it!')))
				.toExist()
				.withTimeout(5000);
			await element(by[textMatcher]('Yes, delete it!').and(by.type(alertButtonType))).tap();
			await waitFor(element(by.id('rooms-list-view')))
				.toExist()
				.withTimeout(10000);
			await waitFor(element(by.id(`rooms-list-view-item-${teamName}`)))
				.toBeNotVisible()
				.withTimeout(60000);
		});
	});
});
