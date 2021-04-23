const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { navigateToLogin, login, searchRoom } = require('../../helpers/app');
const { sendMessage } = require('../../helpers/data_setup')

async function navigateToRoom(user) {
	await searchRoom(`${ user }`);
	await element(by.id(`rooms-list-view-item-${ user }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
}

describe('Mark as unread', () => {
	const user = data.users.alternate.username

	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
		await navigateToRoom(user);
	});

	// TODO: Fix flakiness. If it fails, run it solo.
	describe('Usage', async() => {
		describe('Mark message as unread', async() => {
			it('should mark message as unread', async() => {
				const message = `${ data.random }message`;
				const channelName = `@${ data.users.regular.username }`;
				await sendMessage(data.users.alternate, channelName, message);
				await waitFor(element(by.label(message)).atIndex(0)).toExist().withTimeout(30000);
				await element(by.label(message)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Mark Unread')).tap();
				await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(5000);
				await expect(element(by.id(`rooms-list-view-item-${data.users.alternate.username}`))).toExist();
			});
		});
	});
});
