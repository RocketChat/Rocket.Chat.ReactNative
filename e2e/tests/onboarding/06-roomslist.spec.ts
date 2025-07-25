import { device, waitFor, element, by, expect } from 'detox';

import { login, navigateToLogin, logout, tapBack, searchRoom } from '../../helpers/app';
import { createRandomUser } from '../../helpers/data_setup';

describe('Rooms list screen', () => {
	beforeAll(async () => {
		const user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
		await navigateToLogin();
		await login(user.username, user.password);
	});

	describe('Render', () => {
		it('should have rooms list screen', async () => {
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});

		it('should have room item', async () => {
			await waitFor(element(by.id('rooms-list-view-item-general')))
				.toExist()
				.withTimeout(10000);
		});

		// Render - Header
		describe('Header', () => {
			it('should have create channel button', async () => {
				await expect(element(by.id('rooms-list-view-create-channel'))).toBeVisible();
			});

			it('should have sidebar button', async () => {
				await expect(element(by.id('rooms-list-view-sidebar'))).toBeVisible();
			});
		});
	});

	describe('Usage', () => {
		it('should search room and navigate', async () => {
			await searchRoom('rocket.cat');
			await element(by.id('rooms-list-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('room-view')))
				.toBeVisible()
				.withTimeout(10000);
			await waitFor(element(by.id('room-view-title-rocket.cat')))
				.toBeVisible()
				.withTimeout(60000);
			await tapBack();
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(6000);
			await waitFor(element(by.id('rooms-list-view-item-rocket.cat')))
				.toExist()
				.withTimeout(60000);
		});

		it('should logout', async () => {
			await logout();
		});
	});
});
