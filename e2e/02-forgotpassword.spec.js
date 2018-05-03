const {
	device, expect, element, by, waitFor
} = require('detox');

describe('Forgot password screen', () => {
	before(async() => {
		await device.reloadReactNative();
		await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
		await element(by.id('welcome-view-login')).tap();
		await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
		await element(by.id('login-view-forgot-password')).tap();
		await waitFor(element(by.id('forgot-password-view'))).toBeVisible().withTimeout(2000);
	});

	it('should have a forgot password screen', async() => {
		await expect(element(by.id('forgot-password-view'))).toBeVisible();
	});

	it('should have all inputs and buttons', async() => {
		await expect(element(by.id('forgot-password-view-email'))).toBeVisible();
		await expect(element(by.id('forgot-password-view-submit'))).toBeVisible();
	});

	it('should reset password and navigate to login', async() => {
		await element(by.id('forgot-password-view-email')).tap();
		await element(by.id('forgot-password-view-email')).typeText('testreactnative@rocket.chat');
		await element(by.id('forgot-password-view-submit')).tap();
		await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('login-view'))).toBeVisible();
	});
});
