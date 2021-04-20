const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { navigateToLogin, login, checkServer } = require('../../helpers/app');

const reopenAndCheckServer = async(server) => {
	await device.launchApp({ permissions: { notifications: 'YES' } });
	await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(6000);
	await checkServer(server);
}

describe('Change server', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
	});

	it('should login to server, add new server, close the app, open the app and show previous logged server', async() => {
		await element(by.id('rooms-list-header-server-dropdown-button')).tap();
		await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(5000);
		await element(by.id('rooms-list-header-server-add')).tap();

		await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(6000);
		await element(by.id('new-server-view-input')).typeText(`${data.alternateServer}\n`);
		await waitFor(element(by.id('workspace-view'))).toBeVisible().withTimeout(10000);
		await reopenAndCheckServer(data.server);
	});

	it('should add server and create new user', async() => {
		await element(by.id('rooms-list-header-server-dropdown-button')).tap();
		await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(5000);
		await element(by.id(`rooms-list-header-server-${ data.alternateServer }`)).tap();
		await waitFor(element(by.id('workspace-view'))).toBeVisible().withTimeout(60000);
		await element(by.id('workspace-view-register')).tap();
		await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);

		// Register new user
		await element(by.id('register-view-name')).replaceText(data.registeringUser2.username);
		await element(by.id('register-view-username')).replaceText(data.registeringUser2.username);
		await element(by.id('register-view-email')).replaceText(data.registeringUser2.email);
		await element(by.id('register-view-password')).replaceText(data.registeringUser2.password);
		await element(by.id('register-view-submit')).tap();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);

		await waitFor(element(by.id(`rooms-list-view-item-${ data.groups.private.name }`))).toBeNotVisible().withTimeout(60000);
		await checkServer(data.alternateServer);
	});

	it('should reopen the app and show alternate server', async() => {
		await reopenAndCheckServer(data.alternateServer);
	});

	it('should change back to main server', async() => {
		await element(by.id('rooms-list-header-server-dropdown-button')).tap();
		await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(5000);
		await element(by.id(`rooms-list-header-server-${ data.server }`)).tap();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
		await waitFor(element(by.id(`rooms-list-view-item-${ data.groups.private.name }`))).toBeVisible().withTimeout(60000);
		await checkServer(data.server);
	});

	it('should reopen the app and show main server', async() => {
		await reopenAndCheckServer(data.server);
	})
});
