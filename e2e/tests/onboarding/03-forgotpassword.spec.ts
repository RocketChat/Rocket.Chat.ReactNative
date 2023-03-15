import { device, waitFor, element, by, expect } from 'detox';

import { navigateToLogin, platformTypes, TTextMatcher } from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';

describe('Forgot password screen', () => {
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	let user: ITestUser;
	beforeAll(async () => {
		user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await element(by.id('login-view-forgot-password')).tap();
		await waitFor(element(by.id('forgot-password-view')))
			.toExist()
			.withTimeout(2000);
	});

	describe('Render', () => {
		it('should have forgot password screen', async () => {
			await expect(element(by.id('forgot-password-view'))).toExist();
		});

		it('should have email input', async () => {
			await expect(element(by.id('forgot-password-view-email'))).toBeVisible();
		});

		it('should have submit button', async () => {
			await expect(element(by.id('forgot-password-view-submit'))).toBeVisible();
		});
	});

	describe('Usage', () => {
		it('should reset password and navigate to login', async () => {
			await element(by.id('forgot-password-view-email')).replaceText(user.email);
			await element(by.id('forgot-password-view-submit')).tap();
			await waitFor(element(by[textMatcher]('OK')))
				.toExist()
				.withTimeout(10000);
			await element(by[textMatcher]('OK').and(by.type(alertButtonType))).tap();
			await waitFor(element(by.id('login-view')))
				.toBeVisible()
				.withTimeout(60000);
		});
	});
});
