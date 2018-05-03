const {
	device, expect, element, by, waitFor
} = require('detox');

describe('Add server', () => {
	beforeEach(async() => {
		await device.reloadReactNative();
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
	});

	it('should have an add server screen', async() => {
		await expect(element(by.id('new-server-view'))).toBeVisible();
	});

	it('should have an input to add a new server', async() => {
		await expect(element(by.id('new-server-view-input'))).toBeVisible();
	});

	it('should insert "invalidtest" and get an invalid instance', async() => {
		await element(by.id('new-server-view-input')).tap();
		await element(by.id('new-server-view-input')).typeText('invalidtest');
		await waitFor(element(by.text(' is not a valid Rocket.Chat instance'))).toBeVisible().withTimeout(2000);
		await expect(element(by.text(' is not a valid Rocket.Chat instance'))).toBeVisible();
	});

	it('should insert "open" and get a valid instance', async() => {
		await element(by.id('new-server-view-input')).tap();
		await element(by.id('new-server-view-input')).typeText('open');
		await waitFor(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible().withTimeout(2000);
		await expect(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible();
	});

	it('should have a button to add a new server', async() => {
		await element(by.id('new-server-view-input')).tap();
		await element(by.id('new-server-view-input')).typeText('open');
		await waitFor(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible().withTimeout(2000);
		await expect(element(by.text('Connect'))).toBeVisible();
		await element(by.text('Connect')).tap();
		await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('welcome-view'))).toBeVisible();
	});
});
