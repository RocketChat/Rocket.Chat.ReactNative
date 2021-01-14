const {
	device, expect, element, by, waitFor
} = require('detox');
const { login, navigateToLogin, logout, tapBack } = require('../../helpers/app');
const data = require('../../data');

describe('Server history', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
	});

	describe('Usage', () => {
		it('should login, save server as history and logout', async() => {
			await navigateToLogin();
			await login(data.users.regular.username, data.users.regular.password);
			await logout();
			await element(by.id('join-workspace')).tap();
			await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(60000);
		})

		it('should show servers history', async() => {
			await element(by.id('new-server-view-input')).tap();
			await waitFor(element(by.id(`server-history-${ data.server }`))).toBeVisible().withTimeout(2000);
		});

		it('should tap on a server history and navigate to login', async() => {
			await element(by.id(`server-history-${ data.server }`)).tap();
			await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('login-view-email'))).toHaveText(data.users.regular.username);
		});

		it('should delete server from history', async() => {
			await tapBack();
			await waitFor(element(by.id('workspace-view'))).toBeVisible().withTimeout(2000);
			await tapBack();
			await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('new-server-view-input')).tap();
			await waitFor(element(by.id(`server-history-${ data.server }`))).toBeVisible().withTimeout(2000);
			await element(by.id(`server-history-delete-${ data.server }`)).tap();
			await element(by.id('new-server-view-input')).tap();
			await waitFor(element(by.id(`server-history-${ data.server }`))).toBeNotVisible().withTimeout(2000);
		});
	});
});
