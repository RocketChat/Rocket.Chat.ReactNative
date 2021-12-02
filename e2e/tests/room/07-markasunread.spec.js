const data = require('../../data');
const { navigateToLogin, login, searchRoom, sleep, platformTypes } = require('../../helpers/app');
const { sendMessage } = require('../../helpers/data_setup');

async function navigateToRoom(user) {
	await searchRoom(`${user}`);
	await element(by.id(`rooms-list-view-item-${user}`)).tap();
	await waitFor(element(by.id('room-view')))
		.toBeVisible()
		.withTimeout(5000);
}

describe('Mark as unread', () => {
	const user = data.users.alternate.username;
	let textMatcher;

	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
		await navigateToRoom(user);
	});

	describe('Usage', () => {
		describe('Mark message as unread', () => {
			it('should mark message as unread', async () => {
				const message = `${data.random}message-mark-as-unread`;
				const channelName = `@${data.users.regular.username}`;
				await sendMessage(data.users.alternate, channelName, message);
				await waitFor(element(by[textMatcher](message)).atIndex(0))
					.toExist()
					.withTimeout(30000);
				await sleep(300);
				await element(by[textMatcher](message)).atIndex(0).longPress();
				await waitFor(element(by.id('action-sheet-handle')))
					.toBeVisible()
					.withTimeout(3000);
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by[textMatcher]('Mark Unread')).atIndex(0).tap();
				await waitFor(element(by.id('rooms-list-view')))
					.toExist()
					.withTimeout(5000);
				await expect(element(by.id(`rooms-list-view-item-${data.users.alternate.username}`))).toExist();
			});
		});
	});
});
