import { device, waitFor, element, by, expect } from 'detox';

import { navigateToRegister, navigateToLogin } from '../../helpers/app';

describe('Legal screen', () => {
	describe('From Login', () => {
		beforeAll(async () => {
			await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
			await navigateToLogin();
		});

		it('should have legal button on login', async () => {
			await waitFor(element(by.id('login-view-more')))
				.toBeVisible()
				.withTimeout(60000);
		});

		it('should navigate to legal from login', async () => {
			await expect(element(by.id('login-view-more'))).toBeVisible();
			await element(by.id('login-view-more')).tap();
			await waitFor(element(by.id('legal-view')))
				.toBeVisible()
				.withTimeout(4000);
		});
	});

	describe('From Register', () => {
		beforeAll(async () => {
			await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
			await navigateToRegister();
		});

		it('should have legal button on register', async () => {
			await waitFor(element(by.id('register-view-more')))
				.toBeVisible()
				.withTimeout(60000);
		});

		it('should navigate to legal from register', async () => {
			await expect(element(by.id('register-view-more'))).toBeVisible();
			await element(by.id('register-view-more')).tap();
			await waitFor(element(by.id('legal-view')))
				.toBeVisible()
				.withTimeout(4000);
		});

		it('should have terms of service button', async () => {
			await expect(element(by.id('legal-terms-button'))).toBeVisible();
		});

		it('should have privacy policy button', async () => {
			await expect(element(by.id('legal-privacy-button'))).toBeVisible();
		});

		// We can't simulate how webview behaves, so I had to disable :(
		/*
		it('should navigate to terms', async() => {
		 	await element(by.id('legal-terms-button')).tap();
		 	await waitFor(element(by.id('terms-view'))).toBeVisible().withTimeout(2000);
		 	await expect(element(by.id('terms-view'))).toBeVisible();
		});

		it('should navigate to privacy', async() => {
		 	await tapBack();
		 	await element(by.id('legal-privacy-button')).tap();
		 	await waitFor(element(by.id('privacy-view'))).toBeVisible().withTimeout(2000);
		 	await expect(element(by.id('privacy-view'))).toBeVisible();
		});
		*/
	});
});
