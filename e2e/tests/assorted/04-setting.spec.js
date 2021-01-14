const {
	device, expect, element, by, waitFor
} = require('detox');
const { navigateToLogin, login } = require('../../helpers/app');

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

	describe('Language', async() => {
		it('should navigate to language view', async() => {
			await element(by.id('settings-view-language')).tap();
			await waitFor(element(by.id('language-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('language-view-zh-CN'))).toExist();
			await expect(element(by.id('language-view-de'))).toExist();
			await expect(element(by.id('language-view-en'))).toExist();
			await expect(element(by.id('language-view-fr'))).toExist();
			await expect(element(by.id('language-view-pt-BR'))).toExist();
			await expect(element(by.id('language-view-pt-PT'))).toExist();
			await expect(element(by.id('language-view-ru'))).toExist();
		});

		// it('should navigate to change language', async() => {
		// 	await expect(element(by.id('language-view-zh-CN'))).toExist();
		// 	await element(by.id('language-view-zh-CN')).tap()
		// 	await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
		// 	await expect(element(by.id('rooms-list-view'))).toBeVisible();
		// 	await element(by.id('rooms-list-view-sidebar')).tap();
		// 	await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
		// 	await waitFor(element(by.text('设置'))).toBeVisible().withTimeout(2000);
		// 	await element(by.text('设置')).tap();
		// 	await waitFor(element(by.id('settings-view'))).toBeVisible().withTimeout(2000);
		// 	await element(by.id('settings-view-language')).tap();
		// 	await element(by.id('language-view-en')).tap();
		// 	await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
		// 	await expect(element(by.id('rooms-list-view'))).toBeVisible();
		// 	await element(by.id('rooms-list-view-sidebar')).tap();
		// 	await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
		// 	await expect(element(by.text('Settings'))).toBeVisible();
		// 	await element(by.text('Settings')).tap();
		// 	await expect(element(by.id('settings-view'))).toBeVisible();
		// });
	});
});
