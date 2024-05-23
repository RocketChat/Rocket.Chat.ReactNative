import { device, waitFor, element, by, expect } from 'detox';

import {
	navigateToLogin,
	login,
	sleep,
	platformTypes,
	TTextMatcher,
	tapBack,
	navigateToRoom,
	mockMessage,
	checkRoomTitle
} from '../../helpers/app';
import { createRandomRoom, createRandomUser, ITestUser } from '../../helpers/data_setup';

describe('Forward a message with another user', () => {
	let user: ITestUser;
	let otherUser: ITestUser;
	let room: string;
	let textMatcher: TTextMatcher;
	let messageToUser: string;
	let messageToRoom: string;

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
		describe('Start a DM with other user', () => {
			it('should create a DM', async () => {
				await navigateToRoom(otherUser.username);
			});
			it('should send a message and back to Rooms List View', async () => {
				messageToUser = await mockMessage('Hello user');
				await tapBack();
			});
		});
		describe('Forward a message from room to the otherUser', () => {
			it('should navigate to room and send a message', async () => {
				await navigateToRoom(room);
				messageToRoom = await mockMessage('Hello room');
				await sleep(300);
			});
			it('should open the action sheet and tap Forward', async () => {
				await waitFor(element(by[textMatcher](messageToRoom)).atIndex(0))
					.toBeVisible()
					.withTimeout(2000);
				await element(by[textMatcher](messageToRoom)).atIndex(0).longPress();
				await waitFor(element(by.id('action-sheet')))
					.toExist()
					.withTimeout(2000);
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by[textMatcher]('Forward')).atIndex(0).tap();
				await sleep(300);
			});
			it('should forward the message', async () => {
				await waitFor(element(by.id('forward-message-view')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by[textMatcher]('Select')).tap();
				await sleep(300);
				await element(by.id('multi-select-search')).replaceText(`${otherUser.username}`);
				await waitFor(element(by.id(`multi-select-item-${otherUser.username.toLowerCase()}`)))
					.toExist()
					.withTimeout(10000);
				await element(by.id(`multi-select-item-${otherUser.username.toLowerCase()}`)).tap();
				await sleep(500);
				await element(by.id('multi-select-search')).tapReturnKey();
				await sleep(500);
				await waitFor(element(by.id('multi-select-search')))
					.not.toBeVisible()
					.withTimeout(10000);
				await waitFor(element(by.id('forward-message-view-send')))
					.toBeVisible()
					.withTimeout(10000);
				await sleep(300);
				await element(by.id('forward-message-view-send')).tap();
				await sleep(300);
				await checkRoomTitle(room);
			});
			it('should go to otherUser DM and verify if exist both messages', async () => {
				await tapBack();
				await navigateToRoom(otherUser.username);
				await waitFor(element(by[textMatcher](messageToUser)))
					.toExist()
					.withTimeout(2000);
				await waitFor(element(by[textMatcher](messageToRoom)))
					.toExist()
					.withTimeout(2000);
			});
		});
	});
});
