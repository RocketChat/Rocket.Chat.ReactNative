const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { sleep, createUser } = require('../../helpers/app');

const checkServer = async(server) => {
	const label = `Connected to ${ server }`;
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
	await waitFor(element(by.label(label))).toBeVisible().withTimeout(60000);
	await expect(element(by.label(label))).toBeVisible();
	await element(by.type('UIScrollView')).atIndex(1).swipe('left'); // close sidebar
}

describe('Change server', () => {
	before(async() => {
		await createUser();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
	});

	it('should be logged in main server', async() => {
		await checkServer(data.server);
	})

	it('should add server and create new user', async() => {
		await sleep(5000);
		await element(by.id('rooms-list-header-server-dropdown-button')).tap();
		await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(5000);
		await expect(element(by.id('rooms-list-header-server-dropdown'))).toExist();
		await sleep(1000);
		await element(by.id('rooms-list-header-server-add')).tap();

		// TODO: refactor
		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(60000);
		await element(by.id('new-server-view-input')).replaceText(data.alternateServer);
		await element(by.id('new-server-view-button')).tap();
		await waitFor(element(by.id('workspace-view'))).toBeVisible().withTimeout(60000);
		await expect(element(by.id('workspace-view'))).toBeVisible();
		await element(by.id('workspace-view-register')).tap();
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
		// await waitFor(element(by.id(`rooms-list-view-item-public${ data.random }`))).toBeNotVisible().withTimeout(60000);
		// await expect(element(by.id(`rooms-list-view-item-public${ data.random }`))).toBeNotVisible();
		await checkServer(data.alternateServer);
	});

	it('should change back', async() => {
		await sleep(5000);
		await element(by.id('rooms-list-header-server-dropdown-button')).tap();
		await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(5000);
		await expect(element(by.id('rooms-list-header-server-dropdown'))).toExist();
		await sleep(1000);
		await element(by.id(`rooms-list-header-server-${ data.server }`)).tap();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
		await checkServer(data.server);
	});
});
