// const OTP = require('otp.js');
// const GA = OTP.googleAuthenticator;
import { device, waitFor, element, by, expect } from 'detox';

import {
	navigateToLogin,
	login,
	tapBack,
	searchRoom,
	platformTypes,
	TTextMatcher,
	checkRoomTitle,
	mockMessage,
	jumpToQuotedMessage
} from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';
import random from '../../helpers/random';

describe('Broadcast room', () => {
	let textMatcher: TTextMatcher;
	let user: ITestUser;
	let otherUser: ITestUser;
	let message: string;
	const room = `broadcast${random()}`;

	beforeAll(async () => {
		user = await createRandomUser();
		otherUser = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
	});

	it('should create broadcast room', async () => {
		await waitFor(element(by.id('rooms-list-view-create-channel')))
			.toExist()
			.withTimeout(2000);
		await element(by.id('rooms-list-view-create-channel')).tap();
		await waitFor(element(by.id('new-message-view')))
			.toBeVisible()
			.withTimeout(5000);
		await waitFor(element(by.id('new-message-view-create-channel')))
			.toBeVisible()
			.withTimeout(2000);
		await element(by.id('new-message-view-create-channel')).tap();
		await waitFor(element(by.id('select-users-view')))
			.toBeVisible()
			.withTimeout(2000);
		await element(by.id('select-users-view-search')).replaceText(otherUser.username);
		await waitFor(element(by.id(`select-users-view-item-${otherUser.username}`)))
			.toBeVisible()
			.withTimeout(60000);
		await element(by.id(`select-users-view-item-${otherUser.username}`)).tap();
		await waitFor(element(by.id(`selected-user-${otherUser.username}`)))
			.toBeVisible()
			.withTimeout(5000);
		await element(by.id('selected-users-view-submit')).tap();
		await waitFor(element(by.id('create-channel-view')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('create-channel-name')).replaceText(room);
		await element(by.id('create-channel-name')).tapReturnKey();
		await element(by.id('create-channel-broadcast')).tap();
		await element(by.id('create-channel-submit')).tap();
		await checkRoomTitle(room);
		await element(by.id('room-header')).tap();
		await waitFor(element(by.id('room-actions-view')))
			.toBeVisible()
			.withTimeout(5000);
		await element(by.id('room-actions-info')).tap();
		await waitFor(element(by.id('room-info-view')))
			.toBeVisible()
			.withTimeout(2000);
		await expect(element(by.label('Broadcast').withAncestor(by.id('room-info-view-broadcast')))).toBeVisible();
		await tapBack();
		await waitFor(element(by.id('room-actions-view')))
			.toBeVisible()
			.withTimeout(2000);
		await tapBack();
		await checkRoomTitle(room);
		message = await mockMessage('message');
	});

	it('should login as user without write message authorization and enter room', async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(otherUser.username, otherUser.password);

		// await waitFor(element(by.id('two-factor'))).toBeVisible().withTimeout(5000);
		// await expect(element(by.id('two-factor'))).toBeVisible();
		// const code = GA.gen(data.alternateUserTOTPSecret);
		// await element(by.id('two-factor-input')).replaceText(code);
		// await element(by.id('two-factor-send')).tap();

		await searchRoom(room);
		await element(by.id(`rooms-list-view-item-${room}`)).tap();
		await waitFor(element(by.id('room-view')))
			.toBeVisible()
			.withTimeout(5000);
		await waitFor(element(by.id(`room-view-title-${room}`)))
			.toBeVisible()
			.withTimeout(60000);
	});

	it('should not have message composer', async () => {
		await expect(element(by.id('message-composer'))).toBeNotVisible();
	});

	it('should be read only', async () => {
		await expect(element(by.label('This room is read only'))).toExist();
	});

	it('should have the message created earlier', async () => {
		await waitFor(element(by[textMatcher](message)))
			.toExist()
			.withTimeout(60000);
	});

	it('should tap on reply button and navigate to direct room', async () => {
		await expect(element(by.id('message-broadcast-reply'))).toBeVisible();
		await element(by.id('message-broadcast-reply')).tap();
		await waitFor(element(by.id(`room-view-title-${user.username}`)))
			.toBeVisible()
			.withTimeout(5000);
	});

	it('should reply broadcasted message', async () => {
		await element(by.id('message-composer-input')).typeText(`${random()}broadcastreply`);
		// await sleep(300);
		await element(by.id('message-composer-send')).tap();
		await waitFor(element(by[textMatcher](message)))
			.toExist()
			.withTimeout(60000);
		await jumpToQuotedMessage(element(by[textMatcher](message)));
		// await sleep(300); // wait for animation
		await checkRoomTitle(room);
	});
});
