const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const data = require('./data');

describe('Forgot password screen', () => {
	before(async() => {
		await element(by.id('welcome-view-login')).tap();
    	await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
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
			await element(by.id('forgot-password-view-email')).replaceText('diego.mello@rocket.chat');
			await element(by.id('forgot-password-view-submit')).tap();
			await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('login-view'))).toBeVisible();
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});
});
