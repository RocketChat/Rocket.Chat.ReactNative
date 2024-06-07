import { by, device, element, waitFor } from 'detox';

import { login, logout, navigateToLogin } from '../../helpers/app';
import { createRandomUser } from '../../helpers/data_setup';

describe('Change password required', () => {
	let user = { username: '', password: '' };

	beforeAll(async () => {
		user = await createRandomUser({ requirePasswordChange: true });
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(user.username, user.password);
	});

	describe('Usage', () => {
		it('should have required password info displayed', async () => {
			await waitFor(element(by.id(`change-password-required-button`)))
				.toExist()
				.withTimeout(5000);
		});

		it('should logout correctly', async () => {
			await waitFor(element(by.id(`change-password-required-logout`)))
				.toExist()
				.withTimeout(5000);
			await element(by.id('change-password-required-logout')).tap();
			await waitFor(element(by.id('new-server-view')))
				.toExist()
				.withTimeout(10000);
		});

		it('should change password correctly', async () => {
			await navigateToLogin();
			await login(user.username, user.password);
			await waitFor(element(by.id(`change-password-required-button`)))
				.toExist()
				.withTimeout(5000);
			await element(by.id('change-password-required-button')).tap();
			await waitFor(element(by.id(`action-sheet-content-with-input-and-submit`)))
				.toExist()
				.withTimeout(5000);
			await element(by.id('change-password-required-sheet-input-password')).replaceText('123456');
			await element(by.id('change-password-required-sheet-input-confirm-password')).replaceText('123456');
			await element(by.id('change-password-required-sheet-confirm')).tap();
			await waitFor(element(by.id(`change-password-required-button`)))
				.not.toExist()
				.withTimeout(5000);
			await waitFor(element(by.id('rooms-list-view-item-general')))
				.toExist()
				.withTimeout(10000);
			await logout();
		});

		it('should login correctly after password change', async () => {
			await navigateToLogin();
			await login(user.username, '123456');
			await waitFor(element(by.id('rooms-list-view-item-general')))
				.toExist()
				.withTimeout(10000);
		});
	});
});
