import { device, waitFor, element, by, expect } from 'detox';

import { TTextMatcher, platformTypes } from '../../helpers/app';
import data from '../../data';

describe('Onboarding', () => {
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	beforeAll(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await waitFor(element(by.id('new-server-view')))
			.toBeVisible()
			.withTimeout(20000);
	});

	describe('Render', () => {
		it('should have onboarding screen', async () => {
			await expect(element(by.id('new-server-view'))).toBeVisible();
		});
	});

	describe('Usage', () => {
		it('should enter an invalid server and get error', async () => {
			await element(by.id('new-server-view-input')).replaceText('invalidtest');
			await element(by.id('new-server-view-input')).tapReturnKey();
			await waitFor(element(by[textMatcher]('Invalid workspace URL')))
				.toExist()
				.withTimeout(10000);
			await element(by[textMatcher]('OK').and(by.type(alertButtonType))).tap();
		});

		it('should enter a valid server without login services and navigate to login', async () => {
			await device.launchApp({ newInstance: true });
			await waitFor(element(by.id('new-server-view')))
				.toBeVisible()
				.withTimeout(5000);
			await element(by.id('new-server-view-input')).replaceText(data.server);
			await element(by.id('new-server-view-input')).tapReturnKey();
			await waitFor(element(by.id('workspace-view')))
				.toBeVisible()
				.withTimeout(60000);
		});
	});
});
