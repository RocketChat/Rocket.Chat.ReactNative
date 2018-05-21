const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { logout } = require('./helpers/app');
const data = require('./data');

async function navigateToRegister() {
    await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
    await element(by.id('welcome-view-register')).tap();
    await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
}

describe('Create user screen', () => {
	before(async() => {
		await device.reloadReactNative();
		await navigateToRegister();
	});

	describe('Render', () => {
		it('should have create user screen', async() => {
			await expect(element(by.id('register-view'))).toBeVisible();
		});

		it('should have name input', async() => {
			await expect(element(by.id('register-view-name'))).toBeVisible();
		});

		it('should have email input', async() => {
			await expect(element(by.id('register-view-email'))).toBeVisible();
		});

		it('should have password input', async() => {
			await expect(element(by.id('register-view-password'))).toBeVisible();
		});

		it('should have show password icon', async() => {
			await expect(element(by.id('register-view-password-icon-right'))).toBeVisible();
		});

		it('should have repeat password input', async() => {
			await expect(element(by.id('register-view-repeat-password'))).toBeVisible();
		});

		it('should have repeat password icon', async() => {
			await expect(element(by.id('register-view-repeat-password-icon-right'))).toBeVisible();
		});

		it('should have submit button', async() => {
			await expect(element(by.id('register-view-submit'))).toBeVisible();
		});

		it('should have close modal', async() => {
			await expect(element(by.id('close-modal-button'))).toBeVisible();
		});

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', () => {
		it('should navigate to welcome', async() => {
			await element(by.id('close-modal-button')).tap();
			await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('welcome-view'))).toBeVisible();
		});

		it('should submit empty form and raise error', async() => {
			await navigateToRegister();
			await element(by.id('register-view-submit')).tap();
			await waitFor(element(by.text('Some field is invalid or empty'))).toBeVisible().withTimeout(10000);
			await expect(element(by.text('Some field is invalid or empty'))).toBeVisible();
		});

		it('should submit different passwords and raise error', async() => {
			await element(by.id('register-view-name')).replaceText(data.user);
			await element(by.id('register-view-email')).replaceText(data.email);
			await element(by.id('register-view-password')).replaceText('abc');
			await element(by.id('register-view-repeat-password')).replaceText('xyz');
			await element(by.id('register-view-submit')).tap();
			await waitFor(element(by.text('Some field is invalid or empty'))).toBeVisible().withTimeout(10000);
			await expect(element(by.text('Some field is invalid or empty'))).toBeVisible();
		});

		it('should submit invalid email and raise error', async() => {
			await element(by.id('register-view-name')).replaceText(data.user);
			await element(by.id('register-view-email')).replaceText('invalidemail');
			await element(by.id('register-view-password')).replaceText(data.password);
			await element(by.id('register-view-repeat-password')).replaceText(data.password);
			await element(by.id('register-view-submit')).tap();
			await waitFor(element(by.id('register-view-error'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('register-view-error'))).toBeVisible();
			await expect(element(by.id('register-view-error'))).toHaveText('Invalid email invalidemail');
		});

		it('should submit email already taken and raise error', async() => {
			await element(by.id('register-view-name')).replaceText(data.user);
			await element(by.id('register-view-email')).replaceText('diego.mello@rocket.chat');
			await element(by.id('register-view-password')).replaceText(data.password);
			await element(by.id('register-view-repeat-password')).replaceText(data.password);
			await element(by.id('register-view-submit')).tap();
			await waitFor(element(by.id('register-view-error'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('register-view-error'))).toBeVisible();
			await expect(element(by.id('register-view-error'))).toHaveText('Email already exists.');
		});

		it('should complete first part of register', async() => {
			await element(by.id('register-view-name')).replaceText(data.user);
			await element(by.id('register-view-email')).replaceText(data.email);
			await element(by.id('register-view-password')).replaceText(data.password);
			await element(by.id('register-view-repeat-password')).replaceText(data.password);
			await element(by.id('register-view-submit')).tap();
			await waitFor(element(by.id('register-view-username'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('register-view-username'))).toBeVisible();
		});

		it('should submit empty username and raise error', async() => {
			await element(by.id('register-view-submit-username')).tap();
			await waitFor(element(by.text('Username is empty'))).toBeVisible().withTimeout(10000);
			await expect(element(by.text('Username is empty'))).toBeVisible();
		});

		it('should submit already taken username and raise error', async() => {
			await element(by.id('register-view-username')).replaceText('diego.mello');
			await element(by.id('register-view-submit-username')).tap();
			await waitFor(element(by.id('register-view-error'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('register-view-error'))).toBeVisible();
		});

		it('should finish register', async() => {
			await element(by.id('register-view-username')).replaceText(data.user);
			await element(by.id('register-view-submit-username')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});

		// TODO: terms and privacy

		afterEach(async() => {
			takeScreenshot();
		});

		after(async() => {
			await logout();
		});
	});
});
