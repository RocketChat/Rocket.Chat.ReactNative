import { device, waitFor, element, by, expect } from 'detox';

import { navigateToLogin, login, sleep } from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';

describe('Status screen', () => {
	let user: ITestUser;

	beforeAll(async () => {
		user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(user.username, user.password);

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

		it('should change status text', async () => {
			await element(by.id('status-view-input')).replaceText('status-text-new');
			await element(by.id('status-view-submit')).tap();
			await sleep(3000); // Wait until the loading hide
			await waitFor(element(by.text('status-text-new')))
				.toExist()
				.withTimeout(5000);
		});
	});
});
