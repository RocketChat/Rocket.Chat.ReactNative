import { device, waitFor, element, by, expect } from 'detox';

import {
	navigateToLogin,
	login,
	sleep,
	platformTypes,
	TTextMatcher,
	tapBack,
	tapAndWaitFor,
	checkRoomTitle,
	navigateToRoom
} from '../../helpers/app';
import { createRandomRoom, createRandomUser, ITestUser, sendMessage } from '../../helpers/data_setup';

async function navigateToInfoView() {
	await element(by.id('room-header')).tap();
	await waitFor(element(by.id('room-actions-view')))
		.toExist()
		.withTimeout(5000);
	await element(by.id('room-actions-info')).tap();
	await waitFor(element(by.id('room-info-view')))
		.toExist()
		.withTimeout(2000);
}

describe('Ignore/Block User', () => {
	let user: ITestUser;
	let otherUser: ITestUser;
	let room: string;
	let textMatcher: TTextMatcher;

	beforeAll(async () => {
		user = await createRandomUser();
		otherUser = await createRandomUser();
		({ name: room } = await createRandomRoom(user));
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
	});

	describe('Usage', () => {
		describe('Block user from DM', () => {
			it('should go to user info view', async () => {
				await navigateToRoom(otherUser.username);
				await navigateToInfoView();
			});
			it('should block user', async () => {
				await waitFor(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Block user'))))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('room-info-view-ignore')).tap();
				await waitFor(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Unblock user'))))
					.toExist()
					.withTimeout(2000);
				await tapBack();
				await waitFor(element(by.id('room-actions-view')))
					.toBeVisible()
					.withTimeout(5000);
				await tapBack();
				await expect(element(by[textMatcher]('This room is blocked'))).toExist();
			});

			it('should unblock user', async () => {
				await navigateToInfoView();
				await sleep(300); // wait for navigation animation
				await tapAndWaitFor(
					element(by.id('room-info-view-ignore')),
					element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Block user'))),
					2000
				);
				await tapBack();
				await waitFor(element(by.id('room-actions-view')))
					.toBeVisible()
					.withTimeout(5000);
				await tapBack();
				await waitFor(element(by.id('messagebox')))
					.toBeVisible()
					.withTimeout(2000);
				await tapBack();
			});
		});
		describe('Ignore user from Message', () => {
			it('should ignore user from message', async () => {
				await navigateToRoom(room);
				await sendMessage(otherUser, room, 'message-01');
				await sendMessage(otherUser, room, 'message-02');
				await waitFor(element(by[textMatcher](otherUser.username)).atIndex(0))
					.toExist()
					.withTimeout(30000);
				await element(by[textMatcher](otherUser.username)).atIndex(0).tap();
				await sleep(300); // wait for navigation animation
				await waitFor(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Ignore'))))
					.toExist()
					.withTimeout(2000);
				await element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Ignore'))).tap();
				await waitFor(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Unignore'))))
					.toBeVisible()
					.withTimeout(2000);
				await tapBack();
			});

			it('should tap to display message', async () => {
				await checkRoomTitle(room);
				await waitFor(element(by[textMatcher]('Message ignored. Tap to display it.')).atIndex(0))
					.toBeVisible()
					.withTimeout(2000);
				await tapAndWaitFor(
					element(by[textMatcher]('Message ignored. Tap to display it.')).atIndex(0),
					element(by[textMatcher](otherUser.username)),
					2000
				);
				await element(by[textMatcher](otherUser.username)).atIndex(0).tap();
				await sleep(300); // wait for navigation animation
				await expect(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Unignore')))).toBeVisible();
				await element(by.id('room-info-view-ignore')).tap();
				await waitFor(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Ignore'))))
					.toBeVisible()
					.withTimeout(2000);
				await tapBack();
				await waitFor(element(by[textMatcher]('message-02')).atIndex(0))
					.toBeVisible()
					.withTimeout(2000);
			});
		});
	});
});
