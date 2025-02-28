import { device, waitFor, element, by, expect } from 'detox';

import { navigateToLogin, login, platformTypes, TTextMatcher, tapBack } from '../../helpers/app';
import { createRandomRoom, createRandomUser, ITestUser } from '../../helpers/data_setup';

describe('Settings screen', () => {
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	let user: ITestUser;
	let room: string;

	beforeAll(async () => {
		user = await createRandomUser();
		({ name: room } = await createRandomRoom(user));
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
		await waitFor(element(by.id('rooms-list-view')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('rooms-list-view-sidebar')).tap();
		await waitFor(element(by.id('sidebar-view')))
			.toBeVisible()
			.withTimeout(2000);
		await waitFor(element(by.id('sidebar-settings')))
			.toBeVisible()
			.withTimeout(2000);
		await element(by.id('sidebar-settings')).tap();
		await waitFor(element(by.id('settings-view')))
			.toBeVisible()
			.withTimeout(2000);
	});

	describe('Render', () => {
		it('should have settings view', async () => {
			await expect(element(by.id('settings-view'))).toBeVisible();
		});

		it('should have language', async () => {
			await expect(element(by.id('settings-view-language'))).toExist();
		});

		it('should have review app', async () => {
			await expect(element(by.id('settings-view-review-app'))).toExist();
		});

		it('should have share app', async () => {
			await expect(element(by.id('settings-view-share-app'))).toExist();
		});

		it('should have default browser', async () => {
			await expect(element(by.id('settings-view-default-browser'))).toExist();
		});

		it('should have theme', async () => {
			await expect(element(by.id('settings-view-theme'))).toExist();
		});

		it('should have security and privacy', async () => {
			await expect(element(by.id('settings-view-security-privacy'))).toExist();
		});

		it('should have media auto-download', async () => {
			await expect(element(by.id('settings-view-media-auto-download'))).toExist();
		});

		it('should have license', async () => {
			await expect(element(by.id('settings-view-license'))).toExist();
		});

		it('should have legal', async () => {
			await expect(element(by.id('settings-view-legal'))).toExist();
		});

		it('should have version no', async () => {
			await expect(element(by.id('settings-view-version'))).toExist();
		});

		it('should have server version', async () => {
			await expect(element(by.id('settings-view-server-version'))).toExist();
		});

		it('should have get help', async () => {
			await expect(element(by.id('settings-view-get-help'))).toExist();
			await element(by.id('settings-view-get-help')).tap();
			await waitFor(element(by.id('settings-view-get-help-documentation')))
				.toBeVisible()
				.withTimeout(2000);
			await expect(element(by.id('settings-view-get-help-accessibility-statement'))).toExist();
			await expect(element(by.id('settings-view-get-help-glossary'))).toExist();
			await tapBack();
		});
	});

	describe('Usage', () => {
		it('should tap clear cache and navigate to roomslistview', async () => {
			await waitFor(element(by.id('settings-view')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('settings-view-clear-cache')).tap();
			await waitFor(element(by[textMatcher]('This will clear all your offline data.')))
				.toExist()
				.withTimeout(2000);
			await element(by[textMatcher]('Clear').and(by.type(alertButtonType))).tap();
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(5000);
			await waitFor(element(by.id(`rooms-list-view-item-${room}`)))
				.toExist()
				.withTimeout(10000);
		});

		describe('Legal button', () => {
			it('should navigate to legalview', async () => {
				await element(by.id('rooms-list-view-sidebar')).tap();
				await waitFor(element(by.id('sidebar-view')))
					.toBeVisible()
					.withTimeout(2000);
				await waitFor(element(by.id('sidebar-settings')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('sidebar-settings')).tap();
				await waitFor(element(by.id('settings-view')))
					.toBeVisible()
					.withTimeout(2000);

				await expect(element(by.id('settings-view-legal'))).toExist();
				await element(by.id('settings-view-legal')).tap();
				await waitFor(element(by.id('legal-view')))
					.toBeVisible()
					.withTimeout(4000);
			});

			it('should have terms of service button', async () => {
				await expect(element(by.id('legal-terms-button'))).toBeVisible();
			});

			it('should have privacy policy button', async () => {
				await expect(element(by.id('legal-privacy-button'))).toBeVisible();
			});
		});
	});
});
