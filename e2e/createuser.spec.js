const { takeScreenshot } = require('./helpers/screenshot');
const {
	device, expect, element, by, waitFor
} = require('detox');

describe('Create user screen', () => {
	before(async() => {
		await device.launchApp({ newInstance: true, permissions: { notifications: 'YES' } });

		await element(by.id('new-server-view-input')).clearText();
		await element(by.id('new-server-view-input')).typeText('open');
		await waitFor(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible().withTimeout(2000);
		await expect(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible();
		await element(by.text('Connect')).tap();

		await waitFor(element(by.text('Create account'))).toBeVisible().withTimeout(2000);
		await expect(element(by.text('Create account'))).toBeVisible();
		await element(by.text('Create account')).tap();
	});

	afterEach(async() => {
		takeScreenshot();
	});

	it('it should have name input', async() => {
		await waitFor(element(by.id('register-view-input'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('register-view-input'))).toBeVisible();
		await element(by.id('register-view-input')).tap();
		await element(by.id('register-view-input')).typeText('test');
	});

	it('it should have email input', async() => {
		await waitFor(element(by.id('register-view-email'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('register-view-email'))).toBeVisible();
		await element(by.id('register-view-email')).tap();
		await element(by.id('register-view-email')).typeText('test');
	});
	it('it should have password input', async() => {
		await waitFor(element(by.id('register-view-password'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('register-view-password'))).toBeVisible();
		await element(by.id('register-view-password')).tap();
		await element(by.id('register-view-password')).typeText('test');
	});

	it('it should have reapeat password input', async() => {
		await waitFor(element(by.id('register-view-repeat-password'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('register-view-repeat-password'))).toBeVisible();
		await element(by.id('register-view-repeat-password')).tap();
		await element(by.id('register-view-repeat-password')).typeText('test');
	});
	// it('should have a button "I have an account"', async() => {
	// 	await waitFor(element(by.text('I have an account'))).toBeVisible().withTimeout(2000);
	// 	await expect(element(by.text('I have an account'))).toBeVisible();
	// });
});
