const {
	device, element, by, waitFor
} = require('detox');
const { navigateToLogin, login, sleep } = require('../../helpers/app');
const { post } = require('../../helpers/data_setup');

const data = require('../../data');
const testuser = data.users.regular
const defaultLaunchArgs = { permissions: { notifications: 'YES' } };

const navToLanguage = async() => {
	await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
	await waitFor(element(by.id('sidebar-settings'))).toBeVisible().withTimeout(2000);
	await element(by.id('sidebar-settings')).tap();
	await waitFor(element(by.id('settings-view'))).toBeVisible().withTimeout(2000);
	await element(by.id('settings-view-language')).tap();
	await waitFor(element(by.id('language-view'))).toBeVisible().withTimeout(10000);
};

describe('i18n', () => {
	describe('OS language', () => {
		it('OS set to \'en\' and proper translate to \'en\'', async() => {
			await device.launchApp({
				...defaultLaunchArgs,
				languageAndLocale: {
					language: "en",
					locale: "en"
				},
				delete: true
			});
			await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(20000);
			await expect(element(by.id('join-workspace').and(by.label('Join a workspace')))).toBeVisible();
			await expect(element(by.id('create-workspace-button').and(by.label('Create a new workspace')))).toBeVisible();
		});
	
		it('OS set to unavailable language and fallback to \'en\'', async() => {
			await device.launchApp({
				...defaultLaunchArgs,
				languageAndLocale: {
					language: "es-MX",
					locale: "es-MX"
				}
			});
			await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(20000);
			await expect(element(by.id('join-workspace').and(by.label('Join a workspace')))).toBeVisible();
			await expect(element(by.id('create-workspace-button').and(by.label('Create a new workspace')))).toBeVisible();
		});
	
		/**
		 * This test might become outdated as soon as we support the language
		 * Although this seems to be a bad approach, that's the intention for having fallback enabled
		 */
		it('OS set to available language and fallback to \'en\' on strings missing translation', async() => {
			await device.launchApp({
				...defaultLaunchArgs,
				languageAndLocale: {
					language: "nl",
					locale: "nl"
				}
			});
			await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(20000);
			await expect(element(by.id('join-workspace').and(by.label('Join a workspace')))).toBeVisible(); // Missing nl translation
			await expect(element(by.id('create-workspace-button').and(by.label('Een nieuwe workspace maken')))).toBeVisible();
		});
	});

	describe('Rocket.Chat language', () => {
		before(async() => {
			await device.launchApp(defaultLaunchArgs);
			await navigateToLogin();
			await login(testuser.username, testuser.password);
		});

		it('should select \'en\'', async() => {
			await navToLanguage();
			await element(by.id('language-view-en')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
			await element(by.id('rooms-list-view-sidebar')).tap();
			await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('sidebar-chats').withDescendant(by.label('Chats')))).toBeVisible();
			await expect(element(by.id('sidebar-profile').withDescendant(by.label('Profile')))).toBeVisible();
			await expect(element(by.id('sidebar-settings').withDescendant(by.label('Settings')))).toBeVisible();
			await element(by.id('sidebar-close-drawer')).tap();
		});

		it('should select \'nl\' and fallback to \'en\'', async() => {
			await navToLanguage();
			await element(by.id('language-view-nl')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
			await element(by.id('rooms-list-view-sidebar')).tap();
			await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('sidebar-chats').withDescendant(by.label('Chats')))).toBeVisible(); // fallback to en
			await expect(element(by.id('sidebar-profile').withDescendant(by.label('Profiel')))).toBeVisible();
			await expect(element(by.id('sidebar-settings').withDescendant(by.label('Instellingen')))).toBeVisible();
			await element(by.id('sidebar-close-drawer')).tap();
		});

		it('should set unsupported language and fallback to \'en\'', async() => {
			await post('users.setPreferences', { data: { language: 'eo' } }); // Set language to Esperanto
			await device.launchApp(defaultLaunchArgs);
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
			await element(by.id('rooms-list-view-sidebar')).tap();
			await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
			// give the app some time to apply new language
			await sleep(3000);
			await expect(element(by.id('sidebar-chats').withDescendant(by.label('Chats')))).toBeVisible();
			await expect(element(by.id('sidebar-profile').withDescendant(by.label('Profile')))).toBeVisible();
			await expect(element(by.id('sidebar-settings').withDescendant(by.label('Settings')))).toBeVisible();
			await post('users.setPreferences', { data: { language: 'en' } }); // Set back to english
		});
	})
});