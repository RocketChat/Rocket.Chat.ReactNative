import { device, waitFor, element, by, expect } from 'detox';

import { login, navigateToLogin, logout, tapBack } from '../../helpers/app';
import data from '../../data';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';

describe('Server history', () => {
	let user: ITestUser;
	beforeAll(async () => {
		user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
	});

	describe('Usage', () => {
		it('should login, save server as history and logout', async () => {
			await navigateToLogin();
			await login(user.username, user.password);
			await logout();
			await waitFor(element(by.id('new-server-view')))
				.toBeVisible()
				.withTimeout(60000);
		});

		it('should show servers history', async () => {
			await element(by.id('servers-history-button')).tap();
			await waitFor(element(by.id(`servers-history-${data.server}`)))
				.toExist()
				.withTimeout(2000);
		});

		it('should tap on a server history and navigate to login', async () => {
			await element(by.id(`servers-history-${data.server}`)).tap();
			await waitFor(element(by.id('login-view-email')))
				.toExist()
				.withTimeout(5000);
			await expect(element(by.label(user.username).withAncestor(by.id('login-view-email'))));
		});

		it('should delete server from history', async () => {
			await tapBack();
			await waitFor(element(by.id('workspace-view')))
				.toBeVisible()
				.withTimeout(2000);
			await tapBack();
			await waitFor(element(by.id('new-server-view')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('servers-history-button')).tap();
			await waitFor(element(by.id(`servers-history-${data.server}`)))
				.toExist()
				.withTimeout(2000);
			await waitFor(element(by.id(`servers-history-delete-${data.server}`)))
				.toExist()
				.withTimeout(2000);
			await element(by.id(`servers-history-delete-${data.server}`)).tap();

			await waitFor(element(by.id('servers-history-button')))
				.not.toExist()
				.withTimeout(2000);
		});
	});
});
