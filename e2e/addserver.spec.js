
const { takeScreenshot } = require('./helpers/screenshot');
const {
	device, expect, element, by, waitFor
} = require('detox');

describe('Add server', () => {
	before(async() => {
		await device.reloadReactNative({ permissions: { notifications: 'YES' } });
	});
	beforeEach(async() => {
		await device.reloadReactNative();
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
	});

	it('should have an add server screen', async() => {
		await expect(element(by.id('new-server-view'))).toBeVisible();
	});

	it('should have an input to add a new server', async() => {
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id('new-server-view-input'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('new-server-view-input'))).toBeVisible();
	});


	it('should insert invalidtest get a invalid instance for "invalidtest"', async() => {
		await element(by.id('new-server-view-input')).typeText('invalidtest');
		await waitFor(element(by.text(' is not a valid Rocket.Chat instance'))).toBeVisible().withTimeout(10000);
		await expect(element(by.text(' is not a valid Rocket.Chat instance'))).toBeVisible();
	});

	it('should insert open server and get ok', async() => {
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id('new-server-view-input'))).toBeVisible().withTimeout(2000);
		await element(by.id('new-server-view-input')).typeText('open');
	});


	it('should insert open get a valid instance for "open"', async() => {
		await element(by.id('new-server-view-input')).typeText('open');
		await waitFor(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible().withTimeout(2000);
		await expect(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible();
	});

	it('should have a button to add a new server', async() => {
		await element(by.id('new-server-view-input')).typeText('open');
		await waitFor(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible().withTimeout(2000);

		await expect(element(by.text('Connect'))).toBeVisible();
		await element(by.text('Connect')).tap();
	});

	afterEach(async() => {
		takeScreenshot();
	});
});
