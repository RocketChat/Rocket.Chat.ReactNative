const {
	device, expect, element, by, waitFor
} = require('detox');
const { navigateToRegister, navigateToLogin } = require('../../helpers/app');

describe('Legal screen', () => {
	it('should have legal button on login', async() => {
		await device.launchApp({ newInstance: true });
		await navigateToLogin();
		await waitFor(element(by.id('login-view-more'))).toBeVisible().withTimeout(60000);
		await expect(element(by.id('login-view-more'))).toBeVisible();
	});

	it('should navigate to legal from login', async() => {
		await waitFor(element(by.id('login-view-more'))).toBeVisible().withTimeout(60000);
		await element(by.id('login-view-more')).tap();
	});

	it('should have legal button on register', async() => {
		await device.launchApp({ newInstance: true });
		await navigateToRegister();
		await waitFor(element(by.id('register-view-more'))).toBeVisible().withTimeout(60000);
		await expect(element(by.id('register-view-more'))).toBeVisible();
	});

	it('should navigate to legal from register', async() => {
		await waitFor(element(by.id('register-view-more'))).toBeVisible().withTimeout(60000);
		await element(by.id('register-view-more')).tap();
	});

	it('should have legal screen', async() => {
		await expect(element(by.id('legal-view'))).toBeVisible();
	});

	it('should have terms of service button', async() => {
		await expect(element(by.id('legal-terms-button'))).toBeVisible();
	});

	it('should have privacy policy button', async() => {
		await expect(element(by.id('legal-privacy-button'))).toBeVisible();
	});
	

	// We can't simulate how webview behaves, so I had to disable :(
	// it('should navigate to terms', async() => {
	// 	await element(by.id('legal-terms-button')).tap();
	// 	await waitFor(element(by.id('terms-view'))).toBeVisible().withTimeout(2000);
	// 	await expect(element(by.id('terms-view'))).toBeVisible();
	// });
	
	// it('should navigate to privacy', async() => {
	// 	await tapBack();
	// 	await element(by.id('legal-privacy-button')).tap();
	// 	await waitFor(element(by.id('privacy-view'))).toBeVisible().withTimeout(2000);
	// 	await expect(element(by.id('privacy-view'))).toBeVisible();
	// });
});
