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

// 49s
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

		it('should create user', async() => {
			await navigateToRegister();
			await element(by.id('register-view-name')).replaceText(data.user);
			await element(by.id('register-view-email')).replaceText(data.email);
			await element(by.id('register-view-password')).replaceText(data.password);
			await element(by.id('register-view-repeat-password')).replaceText(data.password);
			await element(by.id('register-view-submit')).tap();
			await waitFor(element(by.id('register-view-username'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('register-view-username'))).toBeVisible();
			await element(by.id('register-view-username')).replaceText(data.user);
			await element(by.id('register-view-submit-username')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();

		});
		// TODO: errors
		// TODO: terms and privacy

		after(async() => {
			takeScreenshot();
			await logout();
		});
	});
});
