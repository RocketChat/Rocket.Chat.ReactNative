const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');

describe('Forgot password screen', () => {
	before(async() => {
		await device.launchApp({ delete: true, permissions: { notifications: 'YES' } });
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
		await element(by.id('new-server-view-input')).replaceText('open');
		await waitFor(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id('new-server-view-button'))).toBeVisible().withTimeout(2000);
		await element(by.id('new-server-view-button')).tap();
		await waitFor(element(by.id('new-server-view-button'))).toBeVisible().withTimeout(2000);
		await element(by.id('welcome-view-login')).tap();
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
	})

	describe('Usage', async() => {
		it('should reset password and navigate to login', async() => {
			await element(by.id('forgot-password-view-email')).tap();
			await element(by.id('forgot-password-view-email')).typeText('testreactnative@rocket.chat');
			await element(by.id('forgot-password-view-submit')).tap();
			await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('login-view'))).toBeVisible();
		});

		afterEach(async() => {
			takeScreenshot();
		});
	})
});
