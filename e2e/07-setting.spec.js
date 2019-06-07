const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { logout, navigateToLogin, login } = require('./helpers/app');
const data = require('./data');

const scrollDown = 200;

describe('Settings screen', () => {
	before(async() => {
		await element(by.id('rooms-list-view-sidebar')).tap();
		await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id('sidebar-settings'))).toBeVisible().withTimeout(2000);
		// await expect(element(by.id('sidebar-profile'))).toBeVisible();
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

		it('should have theme', async() => {
			await expect(element(by.id('settings-theme'))).toExist();
		});

		it('should have share app', async() => {
			await expect(element(by.id('settings-share-app'))).toExist();
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
		
		it('should have enable markdown', async() => {
			await expect(element(by.id('settings-view-markdown'))).toExist();
		});

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Language', async() => {
		it('should navigate to language view', async() => {
			await element(by.id('settings-view-language')).tap();
			await waitFor(element(by.id('language-view'))).toBeVisible().withTimeout(60000);
            await expect(element(by.id('language-view-zh-CN'))).toExist();
            await expect(element(by.id('language-de'))).toExist();
            await expect(element(by.id('language-en'))).toExist();
            await expect(element(by.id('language-fr'))).toExist();
            await expect(element(by.id('language-pt-BR'))).toExist();
            await expect(element(by.id('language-pt-PT'))).toExist();
            await expect(element(by.id('language-ru'))).toExist();
		});

		after(async() => {
			takeScreenshot();
		});
	});
});
