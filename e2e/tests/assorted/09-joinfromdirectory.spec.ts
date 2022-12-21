import data from '../../data';
import { navigateToLogin, login, tapBack, sleep } from '../../helpers/app';
import { sendMessage } from '../../helpers/data_setup';

const testuser = data.users.regular;

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
	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(testuser.username, testuser.password);
	});

	describe('Usage', () => {
		const threadMessage = `thread-${data.random}`;
		before(async () => {
			const result = await sendMessage(data.users.alternate, data.channels.detoxpublic.name, threadMessage);
			const threadId = result.message._id;
			await sendMessage(data.users.alternate, result.message.rid, data.random, threadId);
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
			await waitFor(element(by.id(`thread-messages-view-${threadMessage}`)))
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
			await element(by.id('directory-view-dropdown')).tap();
			await element(by.label('Users')).atIndex(0).tap();
			await element(by.label('Search by')).atIndex(0).tap();
			await navigateToRoom(data.users.alternate.username);
		});

		it('should search team and navigate', async () => {
			await tapBack();
			await element(by.id('rooms-list-view-directory')).tap();
			await waitFor(element(by.id('directory-view')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('directory-view-dropdown')).tap();
			await element(by.label('Teams')).atIndex(0).tap();
			await element(by.label('Search by')).atIndex(0).tap();
			await navigateToRoom(data.teams.private.name);
		});
	});
});
