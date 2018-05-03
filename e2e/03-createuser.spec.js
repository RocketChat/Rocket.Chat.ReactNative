const {
	device, expect, element, by, waitFor
} = require('detox');

describe('Create user screen', () => {
	before(async() => {
		await device.reloadReactNative();
		await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
		await element(by.id('welcome-view-register')).tap();
		await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
	});

	it('it should have all inputs and buttons', async() => {
		await expect(element(by.id('register-view-name'))).toBeVisible();
		await expect(element(by.id('register-view-email'))).toBeVisible();
		await expect(element(by.id('register-view-password'))).toBeVisible();
		await expect(element(by.id('register-view-repeat-password'))).toBeVisible();
		await expect(element(by.id('register-view-submit'))).toBeVisible();
		await expect(element(by.id('close-modal-button'))).toBeVisible();
	});

	it('it should create user', async() => {
		const random = new Date().getTime();
		await element(by.id('register-view-name')).tap();
		await element(by.id('register-view-name')).typeText('test');
		await element(by.id('register-view-email')).tap();
		await element(by.id('register-view-email')).replaceText(`diegolmello+${ random }@gmail.com`);
		await element(by.id('register-view-password')).tap();
		await element(by.id('register-view-password')).typeText('test');
		await element(by.id('register-view-repeat-password')).tap();
		await element(by.id('register-view-repeat-password')).typeText('test');
		await element(by.id('register-view-submit')).tap();
		await waitFor(element(by.id('register-view-username'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('register-view-username'))).toBeVisible();
		await element(by.id('register-view-username')).tap();
		await element(by.id('register-view-username')).replaceText(`diegolmello.${ random }`);
		await element(by.id('register-view-submit-username')).tap();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
		await expect(element(by.id('rooms-list-view'))).toBeVisible();
	});
});
