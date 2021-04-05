const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { tapBack, sleep, navigateToLogin, login, tryTapping } = require('../../helpers/app');



describe('Group DM', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
	});

	describe('Create Group DM', async() => {
		before(async() => {
			await element(by.id('rooms-list-view-create-channel')).tap();
		});

		describe('Render', async() => {
			it('should have new message screen', async() => {
				await waitFor(element(by.id('new-message-view'))).toBeVisible().withTimeout(2000);
			});
	
			it('should have search input', async() => {
				await waitFor(element(by.id('new-message-view-search'))).toBeVisible().withTimeout(2000);
			});
		})

		describe('Usage', async() => {
			it('should navigate to create DM', async() => {
				await element(by.label('Create Direct Messages')).tap();
			});

			it('should add users', async() => {
				await element(by.id('select-users-view-search')).replaceText('rocket.cat');
				await waitFor(element(by.id(`select-users-view-item-rocket.cat`))).toBeVisible().withTimeout(10000);
				await element(by.id('select-users-view-item-rocket.cat')).tap();
				await element(by.id('select-users-view-search')).replaceText(data.users.existing.username);
				await waitFor(element(by.id(`select-users-view-item-${data.users.existing.username}`))).toBeVisible().withTimeout(10000);
				await element(by.id(`select-users-view-item-${data.users.existing.username}`)).tap();
				await element(by.id('selected-users-view-submit')).tap();
			});

			it('check Group DM exist', async() => {
				await waitFor(element(by.id(`room-view-title-${data.users.existing.username}, rocket.cat`))).toExist().withTimeout(10000);
			});
	
			
		})
	});
});
