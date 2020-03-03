const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('./data');

describe('Onboarding', () => {
	before(async() => {
		await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(2000);
	});

	describe('Render', async() => {
		it('should have onboarding screen', async() => {
			await expect(element(by.id('onboarding-view'))).toBeVisible();
		});

		it('should have "Connect to a server"', async() => {
			await expect(element(by.id('connect-server-button'))).toBeVisible();
		});

		it('should have "Join the community"', async() => {
			await expect(element(by.id('join-community-button'))).toBeVisible();
		});

		it('should have "Create a new workspace"', async() => {
			await expect(element(by.id('create-workspace-button'))).toBeVisible();
		});
	});

	describe('Usage', async() => {
		it('should navigate to create new workspace', async() => {
			// webviews are not supported by detox: https://github.com/wix/detox/issues/136#issuecomment-306591554
		});
	
		it('should navigate to join community', async() => {
			await element(by.id('join-community-button')).tap();
			await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('welcome-view'))).toBeVisible();
			// await waitFor(element(by.text('Rocket.Chat'))).toBeVisible().withTimeout(60000);
			// await expect(element(by.text('Rocket.Chat'))).toBeVisible();
		});

		it('should navigate to new server', async() => {
			await device.launchApp({ newInstance: true });
			await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('connect-server-button')).tap();
			await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('new-server-view'))).toBeVisible();
		});

		it('should enter an invalid server and get error', async() => {
			await element(by.id('new-server-view-input')).replaceText('invalidtest');
			await element(by.id('new-server-view-button')).tap();
			const errorText = 'Oops!';
			await waitFor(element(by.text(errorText))).toBeVisible().withTimeout(60000);
			await expect(element(by.text(errorText))).toBeVisible();
		});

		it('should enter a valid server with login services and navigate to welcome', async() => {
			await element(by.text('OK')).tap();
			await element(by.id('new-server-view-input')).replaceText('open');
			await element(by.id('new-server-view-button')).tap();
			await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('welcome-view'))).toBeVisible();
		});

		it('should enter a valid server without login services and navigate to login', async() => {
			await device.launchApp({ newInstance: true });
			await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('connect-server-button')).tap();
			await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(60000);
			await element(by.id('new-server-view-input')).replaceText(data.server);
			await element(by.id('new-server-view-button')).tap();
			await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('login-view'))).toBeVisible();
		});
	});
});
