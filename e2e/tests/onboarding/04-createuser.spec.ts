import { navigateToRegister } from '../../helpers/app';
import data from '../../data';

describe('Create user screen', () => {
	beforeAll(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToRegister();
	});

	describe('Usage', () => {
		it('should register', async () => {
			await element(by.id('register-view-name')).replaceText(data.registeringUser.username);
			await element(by.id('register-view-name')).tapReturnKey();
			await element(by.id('register-view-username')).replaceText(data.registeringUser.username);
			await element(by.id('register-view-username')).tapReturnKey();
			await element(by.id('register-view-email')).replaceText(data.registeringUser.email);
			await element(by.id('register-view-email')).tapReturnKey();
			await element(by.id('register-view-password')).replaceText(data.registeringUser.password);
			await element(by.id('login-view-password')).tapReturnKey();
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(60000);
		});
	});
});
