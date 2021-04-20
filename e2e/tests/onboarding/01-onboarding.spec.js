const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');

describe('Onboarding', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(20000);
	});

	describe('Render', () => {
		it('should have onboarding screen', async() => {
			await expect(element(by.id('onboarding-view'))).toBeVisible();
    });

		it('should have "Join a workspace"', async() => {
      await expect(element(by.id('join-workspace'))).toBeVisible();
		});

		it('should have "Create a new workspace"', async() => {
			await expect(element(by.id('create-workspace-button'))).toBeVisible();
		});
	});

	describe('Usage', () => {
		// it('should navigate to create new workspace', async() => {
		// 	// webviews are not supported by detox: https://github.com/wix/detox/issues/136#issuecomment-306591554
		// });
	
		it('should navigate to join a workspace', async() => {
			await element(by.id('join-workspace')).tap();
			await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(60000);
		});

		it('should enter an invalid server and get error', async() => {
			await element(by.id('new-server-view-input')).typeText('invalidtest\n');
			const errorText = 'Oops!';
			await waitFor(element(by.text(errorText))).toBeVisible().withTimeout(60000);
			await element(by.text('OK')).tap();
		});

		it('should tap on "Join our open workspace" and navigate', async() => {
			await element(by.id('new-server-view-open')).tap();
			await waitFor(element(by.id('workspace-view'))).toBeVisible().withTimeout(60000);
		});

		it('should enter a valid server without login services and navigate to login', async() => {
			await device.launchApp({ newInstance: true });
			await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('join-workspace')).tap();
			await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(60000);
			await element(by.id('new-server-view-input')).typeText(`${data.server}\n`);
			await waitFor(element(by.id('workspace-view'))).toBeVisible().withTimeout(60000);
		});
	});
});
