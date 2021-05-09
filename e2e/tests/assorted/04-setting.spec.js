const {
	device, expect, element, by, waitFor
} = require('detox');
const { navigateToLogin, login, tapBack } = require('../../helpers/app');

const data = require('../../data');

const testuser = data.users.regular

describe('Settings screen', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(testuser.username, testuser.password);
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
		await element(by.id('rooms-list-view-sidebar')).tap();
		await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id('sidebar-settings'))).toBeVisible().withTimeout(2000);
		await element(by.id('sidebar-settings')).tap();
		await waitFor(element(by.id('settings-view'))).toBeVisible().withTimeout(2000);
	});

	describe('Render', async() => {
		it('should have settings view', async() => {
			await expect(element(by.id('settings-view'))).toBeVisible();
		});

		it('should have language', async() => {
			await expect(element(by.id('settings-view-language'))).toExist();
		});

		it('should have review app', async() => {
			await expect(element(by.id('settings-view-review-app'))).toExist();
		});

		it('should have share app', async() => {
			await expect(element(by.id('settings-view-share-app'))).toExist();
		});

		it('should have default browser', async() => {
			await expect(element(by.id('settings-view-default-browser'))).toExist();
		});

		it('should have theme', async() => {
			await expect(element(by.id('settings-view-theme'))).toExist();
		});

		it('should have security and privacy', async() => {
			await expect(element(by.id('settings-view-security-privacy'))).toExist();
		});

		it('should have licence', async() => {
			await expect(element(by.id('settings-view-license'))).toExist();
		});

		it('should have version no', async() => {
			await expect(element(by.id('settings-view-version'))).toExist();
		});

		it('should have server version', async() => {
			await expect(element(by.id('settings-view-server-version'))).toExist();
		});
	});

	describe('Usage', async() => {
		it('should tap clear cache and navigate to roomslistview', async() => {
			await waitFor(element(by.id('settings-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('settings-view-clear-cache')).tap();
			await waitFor(element(by.text('This will clear all your offline data.'))).toExist().withTimeout(2000);
			await element(by.label('Clear').and(by.type('_UIAlertControllerActionView'))).tap(); 
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(5000);
			await waitFor(element(by.id(`rooms-list-view-item-${ data.groups.private.name }`))).toExist().withTimeout(10000);
		})
	});
});
