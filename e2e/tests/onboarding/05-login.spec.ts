import { device, waitFor, element, by } from 'detox';

import { navigateToLogin, tapBack, platformTypes, navigateToWorkspace, login, TTextMatcher } from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';

describe('Login screen', () => {
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	let user: ITestUser;
	beforeAll(async () => {
		user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
	});

	describe('Usage', () => {
		it('should insert wrong password and get error', async () => {
			await element(by.id('login-view-email')).replaceText(user.username);
			await element(by.id('login-view-email')).tapReturnKey();
			await element(by.id('login-view-password')).replaceText('NotMyActualPassword');
			await element(by.id('login-view-password')).tapReturnKey();
			await waitFor(element(by[textMatcher]('Your credentials were rejected! Please try again.')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by[textMatcher]('OK').and(by.type(alertButtonType))).tap();
		});

		it('should login with success', async () => {
			await element(by.id('login-view-password')).replaceText(user.password);
			await element(by.id('login-view-password')).tapReturnKey();
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(60000);
		});

		it('should connect, go back, connect to the same server and login', async () => {
			await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
			await navigateToWorkspace();
			await tapBack();
			await navigateToLogin();
			await login(user.username, user.password);
		});
	});
});
