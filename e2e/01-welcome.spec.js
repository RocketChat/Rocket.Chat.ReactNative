const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');

describe('Welcome screen', () => {
	before(async() => {
		await device.reloadReactNative();
		await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
	});

	describe('Render', async() => {
		it('should have welcome screen', async() => {
			await expect(element(by.id('welcome-view'))).toBeVisible();
		});

		it('should have register button', async() => {
			await expect(element(by.id('welcome-view-register'))).toBeVisible();
		});
	
		it('should have login button', async() => {
			await expect(element(by.id('welcome-view-login'))).toBeVisible();
		});

		// TODO: oauth

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', async() => {
		beforeEach(async() => {
			await device.reloadReactNative();
			await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
		});

		it('should navigate to login', async() => {
			await element(by.id('welcome-view-login')).tap();
			await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('login-view'))).toBeVisible();
		});
		
		it('should navigate to register', async() => {
			await element(by.id('welcome-view-register')).tap();
			await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('register-view'))).toBeVisible();
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});
});
