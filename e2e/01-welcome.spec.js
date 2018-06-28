const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { tapBack } = require('./helpers/app');

describe('Welcome screen', () => {
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
		it('should navigate to login', async() => {
			await element(by.id('welcome-view-login')).tap();
			await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('login-view'))).toBeVisible();
			await tapBack('Welcome');
		});
		
		it('should navigate to register', async() => {
			await element(by.id('welcome-view-register')).tap();
			await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('register-view'))).toBeVisible();
			await tapBack('Welcome');
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});
});
