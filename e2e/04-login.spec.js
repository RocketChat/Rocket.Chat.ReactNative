const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { navigateToLogin, tapBack } = require('./helpers/app');
const data = require('./data');

describe('Login screen', () => {
	before(async() => {
		await navigateToLogin();
	});

	describe('Render', () => {
		it('should have login screen', async() => {
			await expect(element(by.id('login-view'))).toBeVisible();
		});

		it('should have email input', async() => {
			await expect(element(by.id('login-view-email'))).toBeVisible();
		});

		it('should have password input', async() => {
			await expect(element(by.id('login-view-password'))).toBeVisible();
		});

		it('should have show password icon', async() => {
			await expect(element(by.id('login-view-password-icon-right'))).toBeVisible();
		});

		it('should have submit button', async() => {
			await expect(element(by.id('login-view-submit'))).toBeVisible();
		});

		it('should have register button', async() => {
			await expect(element(by.id('login-view-register'))).toBeVisible();
		});

		it('should have forgot password button', async() => {
			await expect(element(by.id('login-view-forgot-password'))).toBeVisible();
		});

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', () => {
		it('should navigate to register', async() => {
			await element(by.id('login-view-register')).tap();
			await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('register-view'))).toBeVisible();
			await tapBack('Login');
		});
	
		it('should navigate to forgot password', async() => {
			await element(by.id('login-view-forgot-password')).tap();
			await waitFor(element(by.id('forgot-password-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('forgot-password-view'))).toBeVisible();
			await tapBack('Login');
		});

		it('should navigate to welcome', async() => {
			await tapBack('Welcome');
			await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('welcome-view'))).toBeVisible();
			await element(by.id('welcome-view-login')).tap();
			await expect(element(by.id('login-view'))).toBeVisible();
		});
	
		it('should insert wrong password and get error', async() => {
			await element(by.id('login-view-email')).replaceText(data.user);
			await element(by.id('login-view-password')).replaceText('error');
			await element(by.id('login-view-submit')).tap();
			await waitFor(element(by.text('User or Password incorrect'))).toBeVisible().withTimeout(10000);
			await expect(element(by.text('User or Password incorrect'))).toBeVisible();
		});
	
		it('should login with success', async() => {
			await element(by.id('login-view-password')).replaceText(data.password);
			await element(by.id('login-view-submit')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});
});
