import { expect } from 'detox';

import { navigateToLogin, login, platformTypes, TTextMatcher } from '../../helpers/app';
import data from '../../data';

const testuser = data.users.regular;

describe('Settings screen', () => {
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(testuser.username, testuser.password);
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

		it('should have licence', async () => {
			await expect(element(by.id('settings-view-license'))).toExist();
		});

		it('should have version no', async () => {
			await expect(element(by.id('settings-view-version'))).toExist();
		});

		it('should have server version', async () => {
			await expect(element(by.id('settings-view-server-version'))).toExist();
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
			await waitFor(element(by.id(`rooms-list-view-item-${data.groups.private.name}`)))
				.toExist()
				.withTimeout(10000);
		});
	});
});
