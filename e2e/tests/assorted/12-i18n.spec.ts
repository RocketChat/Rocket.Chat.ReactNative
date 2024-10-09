import Detox, { device, waitFor, element, by, expect } from 'detox';

import { navigateToLogin, login } from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';

const defaultLaunchArgs = { permissions: { notifications: 'YES' } } as Detox.DeviceLaunchAppConfig;

const navToLanguage = async () => {
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
	await element(by.id('settings-view-language')).tap();
	await waitFor(element(by.id('language-view')))
		.toBeVisible()
		.withTimeout(10000);
};

describe('i18n', () => {
	describe('OS language', () => {
		it("OS set to 'en' and proper translate to 'en'", async () => {
			if (device.getPlatform() === 'android') {
				return; // FIXME: Passing language with launch parameters doesn't work with Android
			}
			await device.launchApp({
				...defaultLaunchArgs,
				languageAndLocale: {
					language: 'en',
					locale: 'en'
				},
				delete: true
			});
			await waitFor(element(by.id('new-server-view')))
				.toBeVisible()
				.withTimeout(20000);
		});

		it("OS set to unavailable language and fallback to 'en'", async () => {
			if (device.getPlatform() === 'android') {
				return; // FIXME: Passing language with launch parameters doesn't work with Android
			}
			await device.launchApp({
				...defaultLaunchArgs,
				languageAndLocale: {
					language: 'es-MX',
					locale: 'es-MX'
				}
			});
			await waitFor(element(by.id('new-server-view')))
				.toBeVisible()
				.withTimeout(20000);
		});

		/**
		 * This test might become outdated as soon as we support the language
		 * Although this seems to be a bad approach, that's the intention for having fallback enabled
		 */
		// it('OS set to available language and fallback to \'en\' on strings missing translation', async() => {
		// 	await device.launchApp({
		// 		...defaultLaunchArgs,
		// 		languageAndLocale: {
		// 			language: "nl",
		// 			locale: "nl"
		// 		}
		// 	});
		// });
	});

	describe('Rocket.Chat language', () => {
		let user: ITestUser;
		beforeAll(async () => {
			user = await createRandomUser();
			await device.launchApp({ ...defaultLaunchArgs, delete: true });
			await navigateToLogin();
			await login(user.username, user.password);
		});

		it("should select 'en'", async () => {
			await navToLanguage();
			await element(by.id('language-view-en')).tap();
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('rooms-list-view-sidebar')).tap();
			await waitFor(element(by.id('sidebar-view')))
				.toBeVisible()
				.withTimeout(2000);
			await expect(element(by.id('sidebar-chats').withDescendant(by.label('Chats')))).toBeVisible();
			await expect(element(by.id('sidebar-profile').withDescendant(by.label('Profile')))).toBeVisible();
			await expect(element(by.id('sidebar-settings').withDescendant(by.label('Settings')))).toBeVisible();
			await element(by.id('sidebar-close-drawer')).tap();
		});

		it("should select 'nl' and fallback to 'en'", async () => {
			await navToLanguage();
			await element(by.id('language-view-nl')).tap();
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('rooms-list-view-sidebar')).tap();
			await waitFor(element(by.id('sidebar-view')))
				.toBeVisible()
				.withTimeout(2000);
			await expect(element(by.id('sidebar-chats').withDescendant(by.label('Chats')))).toBeVisible(); // fallback to en
			await expect(element(by.id('sidebar-profile').withDescendant(by.label('Profiel')))).toBeVisible();
			await expect(element(by.id('sidebar-settings').withDescendant(by.label('Instellingen')))).toBeVisible();
			await element(by.id('sidebar-close-drawer')).tap();
		});

		// it("should set unsupported language and fallback to 'en'", async () => {
		// 	await post('users.setPreferences', { data: { language: 'eo' } }); // Set language to Esperanto
		// 	await device.launchApp({ ...defaultLaunchArgs, newInstance: true });
		// 	await waitFor(element(by.id('rooms-list-view')))
		// 		.toBeVisible()
		// 		.withTimeout(10000);
		// 	await element(by.id('rooms-list-view-sidebar')).tap();
		// 	await waitFor(element(by.id('sidebar-view')))
		// 		.toBeVisible()
		// 		.withTimeout(2000);
		// 	// give the app some time to apply new language
		// 	await sleep(3000);
		// 	await expect(element(by.id('sidebar-chats').withDescendant(by.label('Chats')))).toBeVisible();
		// 	await expect(element(by.id('sidebar-profile').withDescendant(by.label('Profile')))).toBeVisible();
		// 	await expect(element(by.id('sidebar-settings').withDescendant(by.label('Settings')))).toBeVisible();
		// 	await post('users.setPreferences', { data: { language: 'en' } }); // Set back to english
		// });
	});
});
