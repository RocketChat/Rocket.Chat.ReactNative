const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const data = require('./data');

describe('Change server', () => {
	before(async() => {
		await device.reloadReactNative();
	});

	it('should add server and create new user', async() => {
		// Navigate to add server
		await element(by.id('rooms-list-view-sidebar')).tap();
		await waitFor(element(by.id('sidebar'))).toBeVisible().withTimeout(2000);
		await element(by.id('sidebar-toggle-server')).tap();
		await waitFor(element(by.id('sidebar-add-server'))).toBeVisible().withTimeout(2000);
		await element(by.id('sidebar-add-server')).tap();
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
		// Add server
		await element(by.id('new-server-view-input')).replaceText(data.alternateServer);
		await waitFor(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible().withTimeout(60000);
		await element(by.id('new-server-view-button')).tap();
		// Navigate to register
		await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
		await element(by.id('welcome-view-register')).tap();
		await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
		// Register new user
		await element(by.id('register-view-name')).replaceText(data.user);
		await element(by.id('register-view-email')).replaceText(data.email);
		await element(by.id('register-view-password')).replaceText(data.password);
		await element(by.id('register-view-repeat-password')).replaceText(data.password);
		await element(by.id('register-view-submit')).tap();
		await waitFor(element(by.id('register-view-username'))).toBeVisible().withTimeout(60000);
		await element(by.id('register-view-username')).replaceText(data.user);
		await element(by.id('register-view-submit-username')).tap();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
		await expect(element(by.id('rooms-list-view'))).toBeVisible();
		// await expect(element(by.id('rooms-list-view-sidebar'))).toHaveLabel(`Connected to ${ data.alternateServer }. Tap to view servers list.`);
		// For a sanity test, to make sure roomslist is showing correct rooms
		// app CANNOT show public room created on previous tests
		await waitFor(element(by.id(`rooms-list-view-item-public${ data.random }`))).toBeNotVisible().withTimeout(60000);
		await expect(element(by.id(`rooms-list-view-item-public${ data.random }`))).toBeNotVisible();
	});

	it('should change server', async() => {
		await element(by.id('rooms-list-view-sidebar')).tap();
		await waitFor(element(by.id('sidebar'))).toBeVisible().withTimeout(2000);
		await element(by.id('sidebar-toggle-server')).tap();
		await waitFor(element(by.id(`sidebar-${ data.server }`))).toBeVisible().withTimeout(2000);
		// await expect(element(by.id(`sidebar-${ data.server }`))).toBeVisible();
		await element(by.id(`sidebar-${ data.server }`)).tap();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
		// await waitFor(element(by.id('rooms-list-view-sidebar').and(by.label(`Connected to ${ data.server }. Tap to view servers list.`)))).toBeVisible().withTimeout(60000);
		// await expect(element(by.id('rooms-list-view-sidebar'))).toHaveLabel(`Connected to ${ data.server }. Tap to view servers list.`);
		// For a sanity test, to make sure roomslist is showing correct rooms
		// app MUST show public room created on previous tests
		await waitFor(element(by.id(`rooms-list-view-item-public${ data.random }`))).toBeVisible().withTimeout(60000);
		await expect(element(by.id(`rooms-list-view-item-public${ data.random }`))).toBeVisible();
	});

	afterEach(async() => {
		takeScreenshot();
	});
});
