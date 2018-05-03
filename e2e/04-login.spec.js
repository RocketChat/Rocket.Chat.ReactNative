const {
	device, expect, element, by, waitFor
} = require('detox');

describe('Login screen', () => {
	before(async() => {
		await device.launchApp({ delete: true, permissions: { notifications: 'YES' } });
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
		await element(by.id('new-server-view-input')).replaceText('open');
		await waitFor(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.text('Connect'))).toBeVisible().withTimeout(2000);
		await element(by.text('Connect')).tap();
	});

	beforeEach(async() => {
		await device.reloadReactNative();
		await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
		await element(by.id('welcome-view-login')).tap();
		await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
	})

	it('should have a login screen', async() => {
		await expect(element(by.id('login-view'))).toBeVisible();
	});

	it('it should have all inputs and buttons', async() => {
		await expect(element(by.id('login-view-email'))).toBeVisible();
		await expect(element(by.id('login-view-password'))).toBeVisible();
		await expect(element(by.id('login-view-submit'))).toBeVisible();
		await expect(element(by.id('login-view-register'))).toBeVisible();
		await expect(element(by.id('login-view-forgot-password'))).toBeVisible();
	});

	it('it should navigate to register', async() => {
		await element(by.id('login-view-register')).tap();
		await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('register-view'))).toBeVisible();
	});

	it('it should navigate to forgot password', async() => {
		await element(by.id('login-view-forgot-password')).tap();
		await waitFor(element(by.id('forgot-password-view'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('forgot-password-view'))).toBeVisible();
	});

	it('it should insert wrong password and get error', async() => {
		await element(by.id('login-view-email')).tap();
		await element(by.id('login-view-email')).replaceText('d0711');
		await element(by.id('login-view-password')).tap();
		await element(by.id('login-view-password')).typeText('error');
		await element(by.id('login-view-submit')).tap();
		await waitFor(element(by.text('User or Password incorrect'))).toBeVisible().withTimeout(10000);
		await expect(element(by.text('User or Password incorrect'))).toBeVisible();
	});

	it('it should login with success', async() => {
		await element(by.id('login-view-email')).tap();
		await element(by.id('login-view-email')).replaceText('d0711');
		await element(by.id('login-view-password')).tap();
		await element(by.id('login-view-password')).replaceText('123');
		await element(by.id('login-view-submit')).tap();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
		await expect(element(by.id('rooms-list-view'))).toBeVisible();
	})
});
