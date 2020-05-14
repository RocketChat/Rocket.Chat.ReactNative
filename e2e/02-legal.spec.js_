const {
	device, expect, element, by, waitFor
} = require('detox');
const { tapBack } = require('./helpers/app');

describe('Legal screen', () => {
	before(async() => {
		await waitFor(element(by.id('legal-view'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('legal-view'))).toBeVisible();
	})

	describe('Render', async() => {
		it('should have legal screen', async() => {
			await expect(element(by.id('legal-view'))).toBeVisible();
		});

		it('should have terms of service button', async() => {
			await expect(element(by.id('legal-terms-button'))).toBeVisible();
		});
	
		it('should have privacy policy button', async() => {
			await expect(element(by.id('legal-privacy-button'))).toBeVisible();
		});
	});

	describe('Usage', async() => {
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

		it('should navigate to welcome', async() => {
			await tapBack();
			await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('welcome-view'))).toBeVisible();
		});
	});
});
