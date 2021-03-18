const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { navigateToLogin, login, mockMessage, tapBack, searchRoom, logout } = require('../../helpers/app');

async function navigateToRoom(user) {
	await searchRoom(`${ user }`);
	await waitFor(element(by.id(`rooms-list-view-item-${ user }`))).toExist().withTimeout(60000);
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

	describe('Usage', async() => {
		describe('Mark message as unread', async() => {
			it('should mark message as unread', async() => {
				await mockMessage('message')
				await expect(element(by.label(`${ data.random }message`)).atIndex(0)).toExist();
				await tapBack();
				await logout();
				await navigateToLogin();
				await login(data.users.alternate.username, data.users.alternate.password);
				await navigateToRoom(data.users.regular.username);
				await element(by.label(`${ data.random }message`)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by.label('Mark Unread')).tap();
				await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(5000);
				await expect(element(by.id(`rooms-list-view-item-${data.users.regular.username}`))).toExist();
			});
		});
	});
});
