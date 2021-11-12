const data = require('../../data');
const { sleep, navigateToLogin, login, checkServer, platformTypes } = require('../../helpers/app');

describe('Delete server', () => {
	let alertButtonType;
	let textMatcher;
	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
	});

	it('should be logged in main server', async () => {
		await checkServer(data.server);
	});

	it('should add server', async () => {
		await sleep(5000);
		await element(by.id('rooms-list-header-server-dropdown-button')).tap();
		await waitFor(element(by.id('rooms-list-header-server-dropdown')))
			.toBeVisible()
			.withTimeout(5000);
		await element(by.id('rooms-list-header-server-add')).tap();

		await waitFor(element(by.id('new-server-view')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('new-server-view-input')).replaceText(`${data.alternateServer}`);
		await element(by.id('new-server-view-input')).tapReturnKey();
		await waitFor(element(by.id('workspace-view')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('workspace-view-register')).tap();
		await waitFor(element(by.id('register-view')))
			.toBeVisible()
			.withTimeout(2000);

		// Register new user
		await element(by.id('register-view-name')).replaceText(data.registeringUser3.username);
		await element(by.id('register-view-username')).replaceText(data.registeringUser3.username);
		await element(by.id('register-view-email')).replaceText(data.registeringUser3.email);
		await element(by.id('register-view-password')).replaceText(data.registeringUser3.password);
		await element(by.id('register-view-submit')).tap();
		await waitFor(element(by.id('rooms-list-view')))
			.toBeVisible()
			.withTimeout(60000);

		await checkServer(data.alternateServer);
	});

	it('should delete server', async () => {
		await element(by.id('rooms-list-header-server-dropdown-button')).tap();
		await waitFor(element(by.id('rooms-list-header-server-dropdown')))
			.toBeVisible()
			.withTimeout(5000);
		await element(by.id(`rooms-list-header-server-${data.server}`)).longPress(1500);
		await element(by[textMatcher]('Delete').and(by.type(alertButtonType))).tap();
		await element(by.id('rooms-list-header-server-dropdown-button')).tap();
		await waitFor(element(by.id('rooms-list-header-server-dropdown')))
			.toBeVisible()
			.withTimeout(5000);
		await waitFor(element(by.id(`rooms-list-header-server-${data.server}`)))
			.toBeNotVisible()
			.withTimeout(10000);
	});
});
