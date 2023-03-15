import { device, waitFor, element, by } from 'detox';

import data from '../../data';
import {
	sleep,
	navigateToLogin,
	login,
	checkServer,
	platformTypes,
	TTextMatcher,
	expectValidRegisterOrRetry
} from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';

describe('Delete server', () => {
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	let user: ITestUser;

	beforeAll(async () => {
		user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
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
		const randomUser = data.randomUser();
		await element(by.id('register-view-name')).replaceText(randomUser.name);
		await element(by.id('register-view-username')).replaceText(randomUser.username);
		await element(by.id('register-view-email')).replaceText(randomUser.email);
		await element(by.id('register-view-password')).replaceText(randomUser.password);
		await element(by.id('register-view-password')).tapReturnKey();
		await expectValidRegisterOrRetry(device.getPlatform());

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
