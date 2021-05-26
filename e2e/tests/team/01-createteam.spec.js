const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { tapBack, sleep, navigateToLogin, login, tryTapping } = require('../../helpers/app');



describe('Create team screen', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
	});

	describe('New Message', async() => {
		before(async() => {
			await element(by.id('rooms-list-view-create-channel')).tap();
		});

		describe('Render', async() => {
			it('should have team button', async() => {
				await waitFor(element(by.id('new-message-view-create-channel'))).toBeVisible().withTimeout(2000);
			});
		})

		describe('Usage', async() => {
			it('should navigate to select users', async() => {
				await element(by.id('new-message-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view'))).toExist().withTimeout(5000);
			});
		})
	});

	describe('Select Users', async() => {
		it('should search users', async() => {
			await element(by.id('select-users-view-search')).replaceText('rocket.cat');
			await waitFor(element(by.id(`select-users-view-item-rocket.cat`))).toBeVisible().withTimeout(10000);
		});

		it('should select/unselect user', async() => {
			// Spotlight issues
			await element(by.id('select-users-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeVisible().withTimeout(10000);
			await element(by.id('selected-user-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeNotVisible().withTimeout(10000);
			// Spotlight issues
			await element(by.id('select-users-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeVisible().withTimeout(10000);
		});

		it('should create team', async() => {
			await element(by.id('selected-users-view-submit')).tap();
			await waitFor(element(by.id('create-channel-view'))).toExist().withTimeout(10000);
		});
	})

	describe('Create Team', async() => {
		describe('Usage', async() => {
			it('should get invalid team name', async() => {
				await element(by.id('create-channel-name')).typeText(`${data.teams.private.name}`);
				await element(by.id('create-channel-submit')).tap();
				await element(by.text('OK')).tap();
			});

			it('should create private team', async() => {
				const room = `private${ data.random }`;
				await element(by.id('create-channel-name')).replaceText('');
				await element(by.id('create-channel-name')).typeText(room);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view'))).toExist().withTimeout(20000);
				await expect(element(by.id('room-view'))).toExist();
				await waitFor(element(by.id(`room-view-title-${ room }`))).toExist().withTimeout(6000);
				await expect(element(by.id(`room-view-title-${ room }`))).toExist();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(10000);
				await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toExist().withTimeout(6000);
				await expect(element(by.id(`rooms-list-view-item-${ room }`))).toExist();
			});
		})
	});
});
