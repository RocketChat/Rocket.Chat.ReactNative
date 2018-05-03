const {
	device, expect, element, by, waitFor
} = require('detox');

describe('Welcome screen', () => {
	before(async() => {
		await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
	});

	it('should have a register button', async() => {
		await waitFor(element(by.id('welcome-view-register'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('welcome-view-register'))).toBeVisible();
	});

	it('should have a login button', async() => {
		await waitFor(element(by.id('welcome-view-login'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('welcome-view-login'))).toBeVisible();
	});
});
