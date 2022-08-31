import { expect } from 'detox';

import { navigateToLogin, login, sleep } from '../../helpers/app';
import data from '../../data';

const testuser = data.users.regular;

describe('Status screen', () => {
	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(testuser.username, testuser.password);

		await element(by.id('rooms-list-view-sidebar')).tap();
		await waitFor(element(by.id('sidebar-view')))
			.toBeVisible()
			.withTimeout(2000);
		await waitFor(element(by.id('sidebar-custom-status-online')))
			.toBeVisible()
			.withTimeout(2000);

		await element(by.id('sidebar-custom-status-online')).tap();
		await waitFor(element(by.id('status-view')))
			.toBeVisible()
			.withTimeout(2000);
	});

	describe('Render', () => {
		it('should have status input', async () => {
			await expect(element(by.id('status-view-input'))).toBeVisible();
			await expect(element(by.id('status-view-online'))).toExist();
			await expect(element(by.id('status-view-busy'))).toExist();
			await expect(element(by.id('status-view-away'))).toExist();
			await expect(element(by.id('status-view-offline'))).toExist();
		});
	});

	describe('Usage', () => {
		it('should change status', async () => {
			await element(by.id('status-view-busy')).tap();
			await element(by.id('status-view-submit')).tap();
			await sleep(3000); // Wait until the loading hide
			await waitFor(element(by.id('rooms-list-view-sidebar')))
				.toBeVisible()
				.withTimeout(2000);
			await waitFor(element(by.id('sidebar-view')))
				.toBeVisible()
				.withTimeout(2000);
			await waitFor(element(by.id('sidebar-custom-status-busy')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('sidebar-custom-status-busy')).tap();
		});

		// TODO: flaky
		it('should change status text', async () => {
			await element(by.id('status-view-input')).replaceText('status-text-new');
			await element(by.id('status-view-submit')).tap();
			await sleep(3000); // Wait until the loading hide
			await waitFor(element(by.label('status-text-new')))
				.toExist()
				.withTimeout(5000);
		});
	});
});
