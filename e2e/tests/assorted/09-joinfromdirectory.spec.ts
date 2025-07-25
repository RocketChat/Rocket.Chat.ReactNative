import { device, waitFor, element, by } from 'detox';

import data from '../../data';
import { navigateToLogin, login, tapBack, sleep } from '../../helpers/app';
import { createRandomTeam, createRandomUser, ITestUser, sendMessage } from '../../helpers/data_setup';
import random from '../../helpers/random';

async function navigateToRoom(search: string) {
	await element(by.id('directory-view-search')).replaceText(search);
	await waitFor(element(by.id(`directory-view-item-${search}`)))
		.toBeVisible()
		.withTimeout(10000);
	await sleep(300); // app takes some time to animate
	await element(by.id(`directory-view-item-${search}`)).tap();
	await waitFor(element(by.id('room-view')).atIndex(0))
		.toExist()
		.withTimeout(5000);
	await waitFor(element(by.id(`room-view-title-${search}`)))
		.toExist()
		.withTimeout(5000);
}

describe('Join room from directory', () => {
	let user: ITestUser;
	let otherUser: ITestUser;
	let team: string;

	beforeAll(async () => {
		user = await createRandomUser();
		otherUser = await createRandomUser();
		team = await createRandomTeam(user);

		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(user.username, user.password);
	});

	describe('Usage', () => {
		const thread = `${random()}thread`;
		beforeAll(async () => {
			const result = await sendMessage(user, data.channels.detoxpublic.name, thread);
			const threadId = result.message._id;
			await sendMessage(user, result.message.rid, 'insidethread', threadId);
		});

		it('should tap directory', async () => {
			await element(by.id('rooms-list-view-directory')).tap();
			await waitFor(element(by.id('directory-view')))
				.toExist()
				.withTimeout(2000);
		});

		it('should search public channel and navigate', async () => {
			await navigateToRoom(data.channels.detoxpublic.name);
		});

		it('should navigate to thread messages view and load messages', async () => {
			await waitFor(element(by.id('room-view-header-threads')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('room-view-header-threads')).tap();
			await waitFor(element(by.id(`thread-messages-view-${thread}`)))
				.toBeVisible()
				.withTimeout(2000);
			await tapBack();
			await waitFor(element(by.id('room-view-header-threads')))
				.toBeVisible()
				.withTimeout(2000);
		});

		it('should search user and navigate', async () => {
			await tapBack();
			await element(by.id('rooms-list-view-directory')).tap();
			await waitFor(element(by.id('directory-view')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('directory-view-filter')).tap();
			await element(by.label('Users')).atIndex(0).tap();
			await navigateToRoom(otherUser.username);
		});

		it('should search team and navigate', async () => {
			await tapBack();
			await element(by.id('rooms-list-view-directory')).tap();
			await waitFor(element(by.id('directory-view')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('directory-view-filter')).tap();
			await element(by.label('Teams')).atIndex(0).tap();
			await navigateToRoom(team);
		});
	});
});
