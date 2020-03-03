const {
	device, expect, element, by, waitFor
} = require('detox');
const { tapBack } = require('./helpers/app');

describe('Welcome screen', () => {
	before(async() => {
		await device.launchApp({ newInstance: true });
		await element(by.id('join-community-button')).tap();
		await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(60000);
	})

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
	});

	describe('Usage', async() => {
		it('should navigate to login', async() => {
			await element(by.id('welcome-view-login')).tap();
			await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('login-view'))).toBeVisible();
		});
		
		it('should navigate to register', async() => {
			await tapBack();
			await element(by.id('welcome-view-register')).tap();
			await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('register-view'))).toBeVisible();
		});

		it('should navigate to legal', async() => {
			await tapBack();
			await element(by.id('welcome-view-more')).tap();
			await waitFor(element(by.id('legal-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('legal-view'))).toBeVisible();
		});
	});
});
