const { takeScreenshot } = require('./helpers/screenshot');

describe('Welcome screen', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' } });
	});

	afterEach(async() => {
		takeScreenshot();
	});

	it('should have a button to create an account ', async() => {
		await waitFor(element(by.text('Create account'))).toBeVisible().withTimeout(2000);
		await expect(element(by.text('Create account'))).toBeVisible();
	});
	it('should have a button "I have an account"', async() => {
		await waitFor(element(by.text('I have an account'))).toBeVisible().withTimeout(2000);
		await expect(element(by.text('I have an account'))).toBeVisible();
	});
});
