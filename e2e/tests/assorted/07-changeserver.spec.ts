import { device, waitFor, element, by } from 'detox';

import data from '../../data';
import { navigateToLogin, login, checkServer, expectValidRegisterOrRetry } from '../../helpers/app';
import { createRandomRoom, createRandomUser, deleteCreatedUsers, IDeleteCreateUser, ITestUser } from '../../helpers/data_setup';

const reopenAndCheckServer = async (server: string) => {
	await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true });
	await waitFor(element(by.id('rooms-list-view')))
		.toBeVisible()
		.withTimeout(10000);
	await checkServer(server);
};

describe('Change server', () => {
	let user: ITestUser;
	let room: string;

	const deleteUsersAfterAll: IDeleteCreateUser[] = [];

	beforeAll(async () => {
		user = await createRandomUser();
		({ name: room } = await createRandomRoom(user));
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(user.username, user.password);
	});

	afterAll(async () => {
		await deleteCreatedUsers(deleteUsersAfterAll);
	});

	it('should open the servers list, have the server add button and create workspace button', async () => {
		await waitFor(element(by.id('rooms-list-header-servers-list-button')))
			.toBeVisible()
			.withTimeout(2000);
		await element(by.id('rooms-list-header-servers-list-button')).tap();
		await waitFor(element(by.id('rooms-list-header-servers-list')))
			.toBeVisible()
			.withTimeout(5000);
		await waitFor(element(by.id('rooms-list-header-server-add')))
			.toBeVisible()
			.withTimeout(5000);
		await waitFor(element(by.id('rooms-list-header-create-workspace-button')))
			.toBeVisible()
			.withTimeout(5000);
	});

	it('should login to server, add new server, close the app, open the app and show previous logged server', async () => {
		await element(by.id('rooms-list-header-server-add')).tap();
		await waitFor(element(by.id('new-server-view')))
			.toBeVisible()
			.withTimeout(6000);
		await element(by.id('new-server-view-input')).replaceText(data.alternateServer);
		await element(by.id('new-server-view-input')).tapReturnKey();
		await waitFor(element(by.id('workspace-view')))
			.toBeVisible()
			.withTimeout(10000);
		await reopenAndCheckServer(data.server);
	});

	it('should add server and create new user', async () => {
		await element(by.id('rooms-list-header-servers-list-button')).tap();
		await waitFor(element(by.id('rooms-list-header-servers-list')))
			.toBeVisible()
			.withTimeout(5000);
		await element(by.id(`server-item-${data.alternateServer}`)).tap();
		await waitFor(element(by.id('workspace-view')))
			.toBeVisible()
			.withTimeout(60000);
		await element(by.id('workspace-view-register')).tap();
		await waitFor(element(by.id('register-view')))
			.toExist()
			.withTimeout(2000);

		// Register new user
		const randomUser = data.randomUser();
		await element(by.id('register-view-name')).replaceText(randomUser.name);
		await element(by.id('register-view-name')).tapReturnKey();
		await element(by.id('register-view-username')).replaceText(randomUser.username);
		await element(by.id('register-view-username')).tapReturnKey();
		await element(by.id('register-view-email')).replaceText(randomUser.email);
		await element(by.id('register-view-email')).tapReturnKey();
		await element(by.id('register-view-password')).replaceText(randomUser.password);
		await element(by.id('register-view-password')).tapReturnKey();
		await expectValidRegisterOrRetry(device.getPlatform());
		deleteUsersAfterAll.push({ server: data.alternateServer, username: randomUser.username });

		await waitFor(element(by.id(`rooms-list-view-item-${room}`)))
			.toBeNotVisible()
			.withTimeout(60000);
		await checkServer(data.alternateServer);
	});

	it('should reopen the app and show alternate server', async () => {
		await reopenAndCheckServer(data.alternateServer);
	});

	it('should change back to main server', async () => {
		await element(by.id('rooms-list-header-servers-list-button')).tap();
		await waitFor(element(by.id('rooms-list-header-servers-list')))
			.toBeVisible()
			.withTimeout(5000);
		await element(by.id(`server-item-${data.server}`)).tap();
		await waitFor(element(by.id('rooms-list-view')))
			.toBeVisible()
			.withTimeout(10000);
		await waitFor(element(by.id(`rooms-list-view-item-${room}`)))
			.toBeVisible()
			.withTimeout(60000);
		await checkServer(data.server);
	});

	it('should reopen the app and show main server', async () => {
		await reopenAndCheckServer(data.server);
	});
});
