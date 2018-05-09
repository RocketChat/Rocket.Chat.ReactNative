const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { addServer, navigateToLogin } = require('./helpers/app');
const data = require('./data');

describe('Forgot password screen', () => {
	before(async() => {
		// await device.launchApp({ delete: true, permissions: { notifications: 'YES' } });
		// await addServer();
		await device.reloadReactNative();
		await navigateToLogin();
		await element(by.id('login-view-forgot-password')).tap();
		await waitFor(element(by.id('forgot-password-view'))).toBeVisible().withTimeout(2000);
	});

	describe('Render', async() => {
		it('should have forgot password screen', async() => {
			await expect(element(by.id('forgot-password-view'))).toBeVisible();
		});
	
		it('should have email input', async() => {
			await expect(element(by.id('forgot-password-view-email'))).toBeVisible();
		});

		it('should have submit button', async() => {
			await expect(element(by.id('forgot-password-view-submit'))).toBeVisible();
		});

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', async() => {
		it('should reset password and navigate to login', async() => {
			await element(by.id('forgot-password-view-email')).tap();
			await element(by.id('forgot-password-view-email')).replaceText(data.email);
			await element(by.id('forgot-password-view-submit')).tap();
			await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('login-view'))).toBeVisible();
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});
});
