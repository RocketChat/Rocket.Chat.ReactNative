import { device, waitFor, element, by, expect } from 'detox';

import { navigateToLogin, login, sleep, platformTypes, TTextMatcher, navigateToRoom } from '../../helpers/app';
import { createRandomUser, ITestUser, sendMessage } from '../../helpers/data_setup';

describe('Mark as unread', () => {
	let user: ITestUser;
	let otherUser: ITestUser;
	let textMatcher: TTextMatcher;

	beforeAll(async () => {
		user = await createRandomUser();
		otherUser = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
		await navigateToRoom(otherUser.username);
	});

	describe('Usage', () => {
		describe('Mark message as unread', () => {
			it('should mark message as unread', async () => {
				const message = 'message-mark-as-unread';
				await sendMessage(otherUser, `@${user.username}`, message);
				await waitFor(element(by[textMatcher](message)).atIndex(0))
					.toExist()
					.withTimeout(30000);
				await sleep(300);
				await element(by[textMatcher](message)).atIndex(0).longPress();
				await waitFor(element(by.id('action-sheet-handle')))
					.toBeVisible()
					.withTimeout(3000);
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by[textMatcher]('Mark unread')).atIndex(0).tap();
				await waitFor(element(by.id('rooms-list-view')))
					.toExist()
					.withTimeout(5000);
				await expect(element(by.id(`rooms-list-view-item-${otherUser.username}`))).toExist();
			});
		});
	});
});
