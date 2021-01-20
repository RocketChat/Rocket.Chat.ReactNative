const {
	expect, element, by, waitFor
} = require('detox');
const { navigateToLogin, tapBack, sleep } = require('../../helpers/app');
const data = require('../../data');

describe('Persistant workspace', () => {
	describe('From Onboarding', () => {
		before(async() => {
			await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
			
		});

		it('should select a valid server, close the app and open again', async() => {
			await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('join-workspace')).tap();
			await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(6000);
			await element(by.id('new-server-view-input')).replaceText(data.server);
			await element(by.id('new-server-view-button')).tap();
			await waitFor(element(by.id('workspace-view'))).toBeVisible().withTimeout(6000);
			await device.terminateApp();
			await device.launchApp({ permissions: { notifications: 'YES' }});
			await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(2000);
		});
	});

	describe('From Current Server', () => {
		before(async() => {
			await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
			await navigateToLogin();
		});

		it('should login to server, add new server, close the app, open the app and show previous logged server', async() => {
			await element(by.id('login-view-email')).replaceText(data.users.regular.username);
			await element(by.id('login-view-password')).replaceText(data.users.regular.password);
			await element(by.id('login-view-submit')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(6000);

			await element(by.id('rooms-list-header-server-dropdown-button')).tap();
			await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(5000);
			await element(by.id('rooms-list-header-server-add')).tap();

			await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(6000);
			await element(by.id('new-server-view-input')).replaceText(data.alternateServer);
			await element(by.id('new-server-view-button')).tap();
			await waitFor(element(by.id('workspace-view'))).toBeVisible().withTimeout(6000);
			await device.terminateApp();
			await device.launchApp({ permissions: { notifications: 'YES' } });
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(6000);
		});
	});

	describe('From New Server', () => {
		before(async() => {
			await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
			await navigateToLogin();
		});

		it('should login to server, add new server, login to new server, close the app, open the app and show latest logged server', async() => {
			await element(by.id('login-view-email')).replaceText(data.users.regular.username);
			await element(by.id('login-view-password')).replaceText(data.users.regular.password);
			await element(by.id('login-view-submit')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(6000);

			await element(by.id('rooms-list-header-server-dropdown-button')).tap();
			await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(5000);
			await element(by.id('rooms-list-header-server-add')).tap();

			await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(6000);
			await element(by.id('new-server-view-input')).replaceText(data.alternateServer);
			await element(by.id('new-server-view-button')).tap();
			await waitFor(element(by.id('workspace-view'))).toBeVisible().withTimeout(6000);

			await element(by.id('workspace-view-login')).tap();
			await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('login-view'))).toBeVisible();
			await element(by.id('login-view-email')).replaceText('userfourkjadssldkjaasdf');
			await element(by.id('login-view-password')).replaceText('123');
			await element(by.id('login-view-submit')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(6000);
			await device.terminateApp();
			await device.launchApp({ permissions: { notifications: 'YES' } });
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(6000);
			await expect(element(by.id('rooms-list-header-server-subtitle'))).toHaveLabel(data.alternateServer.substring(8));
		});
	});
});
