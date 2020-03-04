const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('./data');
const { sleep, logout } = require('./helpers/app');

describe('Change server', () => {
	before(async() => {
		await device.launchApp({ newInstance: true });
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
	});

	it('should add server and create new user', async() => {
		await sleep(5000);
		await element(by.id('rooms-list-header-server-dropdown-button')).tap();
		await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(5000);
		await expect(element(by.id('rooms-list-header-server-dropdown'))).toExist();
		await sleep(1000);
		await element(by.id('rooms-list-header-server-add')).tap();
		await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(60000);
		await sleep(1000);
		await element(by.id('connect-server-button')).tap();
		//  Add server
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(60000);
		await element(by.id('new-server-view-input')).replaceText(data.alternateServer);
		await sleep(1000);
		await element(by.id('new-server-view-button')).tap();
		// Navigate to register
		// await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
		// await element(by.id('welcome-view-register')).tap();
		// await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
		try {
			await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('login-view'))).toBeVisible();
			await sleep(1000);
			await element(by.id('login-view-register')).tap();
		} catch (error) {
			await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('welcome-view'))).toBeVisible();
			await sleep(1000);
			await element(by.id('welcome-view-register')).tap();
		}
		await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('register-view'))).toBeVisible();
		// Register new user
		await element(by.id('register-view-name')).replaceText(data.user);
		await element(by.id('register-view-username')).replaceText(data.user);
		await element(by.id('register-view-email')).replaceText(data.email);
		await element(by.id('register-view-password')).replaceText(data.password);
		await sleep(1000);
		await element(by.id('register-view-submit')).tap();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
		await expect(element(by.id('rooms-list-view'))).toBeVisible();
		// For a sanity test, to make sure roomslist is showing correct rooms
		// app CANNOT show public room created on previous tests
		await waitFor(element(by.id(`rooms-list-view-item-public${ data.random }`))).toBeNotVisible().withTimeout(60000);
		await expect(element(by.id(`rooms-list-view-item-public${ data.random }`))).toBeNotVisible();
	});

	it('should change server', async() => {
		await sleep(5000);
		await element(by.id('rooms-list-header-server-dropdown-button')).tap();
		await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(5000);
		await expect(element(by.id('rooms-list-header-server-dropdown'))).toExist();
		await sleep(1000);
		await element(by.id(`rooms-list-header-server-${ data.server }`)).tap();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
		// For a sanity test, to make sure roomslist is showing correct rooms
		// app MUST show public room created on previous tests
		await waitFor(element(by.id(`rooms-list-view-item-public${ data.random }`))).toBeVisible().withTimeout(60000);
		await expect(element(by.id(`rooms-list-view-item-public${ data.random }`))).toBeVisible();
	});
});
