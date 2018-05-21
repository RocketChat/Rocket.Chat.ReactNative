const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const data = require('./data');

describe('Add server', () => {
	before(async() => {
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
	});

	describe('Render', async() => {
		it('should have add server screen', async() => {
			await expect(element(by.id('new-server-view'))).toBeVisible();
		});
	
		it('should have server input', async() => {
			await expect(element(by.id('new-server-view-input'))).toBeVisible();
		});

		it('should have submit button', async() => {
			await expect(element(by.id('new-server-view-button'))).toBeVisible();
		});

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', async() => {
		it('should insert "invalidtest" and get an invalid instance', async() => {
			await element(by.id('new-server-view-input')).replaceText('invalidtest');
			await waitFor(element(by.text(' is not a valid Rocket.Chat instance'))).toBeVisible().withTimeout(60000);
			await expect(element(by.text(' is not a valid Rocket.Chat instance'))).toBeVisible();
		});
	
		it('should have a button to add a new server', async() => {
			await element(by.id('new-server-view-input')).replaceText(data.server);
			await waitFor(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('new-server-view-button'))).toBeVisible();
			await element(by.id('new-server-view-button')).tap();
			await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('welcome-view'))).toBeVisible();
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});
});
