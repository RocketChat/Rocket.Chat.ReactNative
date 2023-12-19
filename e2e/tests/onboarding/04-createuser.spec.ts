import { device, element, by } from 'detox';

import { navigateToRegister, expectValidRegisterOrRetry } from '../../helpers/app';
import data from '../../data';

describe('Create user screen', () => {
	beforeAll(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToRegister();
	});
	describe('Usage', () => {
		it('should register', async () => {
			const user = data.randomUser();
			await element(by.id('register-view-name')).replaceText(user.username);
			await element(by.id('register-view-name')).tapReturnKey();
			await element(by.id('register-view-username')).replaceText(user.username);
			await element(by.id('register-view-username')).tapReturnKey();
			await element(by.id('register-view-email')).replaceText(user.email);
			await element(by.id('register-view-email')).tapReturnKey();
			await element(by.id('register-view-password')).replaceText(user.password);
			await element(by.id('register-view-password')).tapReturnKey();

			await expectValidRegisterOrRetry(device.getPlatform());
		});
	});
});
