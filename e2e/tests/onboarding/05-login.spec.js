const {
	expect, element, by, waitFor
} = require('detox');
const { navigateToLogin, tapBack, sleep } = require('../../helpers/app');
const data = require('../../data');

describe('Login screen', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
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

		it('should have submit button', async() => {
			await expect(element(by.id('login-view-submit'))).toBeVisible();
		});

		it('should have register button', async() => {
			await expect(element(by.id('login-view-register'))).toBeVisible();
		});

		it('should have forgot password button', async() => {
			await expect(element(by.id('login-view-forgot-password'))).toBeVisible();
		});

		it('should have legal button', async() => {
			await expect(element(by.id('login-view-more'))).toBeVisible();
		});
	});

	describe('Usage', () => {
		it('should navigate to register', async() => {
			await element(by.id('login-view-register')).tap();
			await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
			await tapBack();
		});
	
		it('should navigate to forgot password', async() => {
			await element(by.id('login-view-forgot-password')).tap();
			await waitFor(element(by.id('forgot-password-view'))).toExist().withTimeout(2000);
			await tapBack();
		});
	
		it('should insert wrong password and get error', async() => {
			await element(by.id('login-view-email')).replaceText(data.users.regular.username);
			await element(by.id('login-view-password')).replaceText('NotMyActualPassword');
			await element(by.id('login-view-submit')).tap();
			await waitFor(element(by.text('Your credentials were rejected! Please try again.'))).toBeVisible().withTimeout(10000);
			await element(by.text('OK')).tap();
		});
	
		it('should login with success', async() => {
			await element(by.id('login-view-password')).replaceText(data.users.regular.password);
			await element(by.id('login-view-submit')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
		});
	});
});
