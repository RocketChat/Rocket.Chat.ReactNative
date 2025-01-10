import { device, waitFor, element, by, expect } from 'detox';

import {
	navigateToLogin,
	login,
	sleep,
	tapBack,
	platformTypes,
	TTextMatcher,
	tapAndWaitFor,
	mockMessage,
	tryTapping,
	navigateToRoom,
	checkRoomTitle
} from '../../helpers/app';
import { createRandomUser, deleteCreatedUsers, IDeleteCreateUser, ITestUser } from '../../helpers/data_setup';
import random from '../../helpers/random';

let alertButtonType: string;
let textMatcher: TTextMatcher;
const newPassword = 'abc';
const getMessage = (i: number) => `m${i}`;

const loginAs = async (user: ITestUser, enterE2EEPassword = true) => {
	await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
	await navigateToLogin();
	await login(user.username, user.password);

	if (enterE2EEPassword) {
		await waitFor(element(by.id('listheader-encryption')))
			.toBeVisible()
			.withTimeout(2000);
		await tapAndWaitFor(element(by.id('listheader-encryption')), element(by.id('e2e-enter-your-password-view')), 2000);
		await element(by.id('e2e-enter-your-password-view-password')).replaceText(newPassword);
		await element(by.id('e2e-enter-your-password-view-confirm')).tap();
		await waitFor(element(by.id('listheader-encryption')))
			.not.toExist()
			.withTimeout(10000);
	}
};

async function waitForToast() {
	await sleep(300);
}

const navToE2EESecurity = async () => {
	await waitFor(element(by.id('rooms-list-view')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-view')))
		.toBeVisible()
		.withTimeout(2000);
	await waitFor(element(by.id('sidebar-settings')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('sidebar-settings')).tap();
	await waitFor(element(by.id('settings-view')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('settings-view-security-privacy')).tap();
	await waitFor(element(by.id('security-privacy-view')))
		.toBeVisible()
		.withTimeout(2000);
	await expect(element(by.id('security-privacy-view-e2e-encryption'))).toExist();
	await element(by.id('security-privacy-view-e2e-encryption')).tap();
	await waitFor(element(by.id('e2e-encryption-security-view')))
		.toBeVisible()
		.withTimeout(2000);
	// await expect(element(by.id('e2e-encryption-security-view-password'))).toExist();
	// await expect(element(by.id('e2e-encryption-security-view-change-password'))).toExist();
	await expect(element(by.id('e2e-encryption-security-view-reset-key'))).toExist();
};

const changeE2EEPassword = async () => {
	await navToE2EESecurity();
	await element(by.id('e2e-encryption-security-view-password')).replaceText(newPassword);
	await element(by.id('e2e-encryption-security-view-change-password')).tap();
	await waitFor(element(by[textMatcher]('Are you sure?')))
		.toExist()
		.withTimeout(2000);
	await expect(element(by[textMatcher]("Make sure you've saved it carefully somewhere else."))).toExist();
	await element(by[textMatcher]('Yes, change it')).atIndex(0).tap();
	await waitForToast();
};

const resetE2EEKey = async () => {
	await navToE2EESecurity();
	await element(by.id('e2e-encryption-security-view-reset-key')).tap();
	await waitFor(element(by[textMatcher]('Are you sure?')))
		.toExist()
		.withTimeout(2000);
	await expect(element(by[textMatcher]("You're going to be logged out."))).toExist();
	await element(by[textMatcher]('Yes, reset it').and(by.type(alertButtonType))).tap();
	await waitFor(element(by.id('new-server-view')))
		.toBeVisible()
		.withTimeout(60000);
};

const readMessages = async (count: number) => {
	for (let i = 0; i < count; i++) {
		await waitFor(element(by[textMatcher](getMessage(i))).atIndex(0))
			.toExist()
			.withTimeout(2000);
	}
};

describe('E2E Encryption', () => {
	const room = `encrypted${random()}`;
	let UserA: ITestUser;
	let UserB: ITestUser;

	const deleteUsersAfterAll: IDeleteCreateUser[] = [];

	beforeAll(async () => {
		UserA = await createRandomUser();
		UserB = await createRandomUser();
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await loginAs(UserB, false);
		await changeE2EEPassword();
		await loginAs(UserA, false);
		await changeE2EEPassword();
	});

	afterAll(async () => {
		await deleteCreatedUsers(deleteUsersAfterAll);
	});

	describe('Create room as UserA and send a message', () => {
		it('should create encrypted room', async () => {
			await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true });
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
			await element(by.id('select-users-view-search')).replaceText(UserB.username);
			await waitFor(element(by.id(`select-users-view-item-${UserB.username}`)))
				.toBeVisible()
				.withTimeout(60000);
			await element(by.id(`select-users-view-item-${UserB.username}`)).tap();
			await waitFor(element(by.id(`selected-user-${UserB.username}`)))
				.toBeVisible()
				.withTimeout(5000);
			await element(by.id('selected-users-view-submit')).tap();
			await waitFor(element(by.id('create-channel-view')))
				.toExist()
				.withTimeout(5000);
			await element(by.id('create-channel-name')).replaceText(room);
			await element(by.id('create-channel-name')).tapReturnKey();
			await element(by.id('create-channel-encrypted')).longPress();
			await element(by.id('create-channel-submit')).tap();
			await checkRoomTitle(room);
		});

		it('should send message and be able to read it', async () => {
			await mockMessage(getMessage(0));
		});

		it('should quote a message and be able to read both', async () => {
			const mockedMessageTextToQuote = await mockMessage(getMessage(1));
			const quotedMessage = getMessage(2);
			await tryTapping(element(by[textMatcher](mockedMessageTextToQuote)).atIndex(0), 2000, true);
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await expect(element(by.id('action-sheet-handle'))).toBeVisible();
			await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
			await element(by[textMatcher]('Quote')).atIndex(0).tap();
			await element(by.id('message-composer-input')).replaceText(quotedMessage);
			await waitFor(element(by.id('message-composer-send')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('message-composer-send')).tap();
			await waitFor(element(by[textMatcher](quotedMessage)).atIndex(0))
				.toBeVisible()
				.withTimeout(3000);
			await waitFor(
				element(
					by.id(`reply-${UserA.name}-${mockedMessageTextToQuote}`).withDescendant(by[textMatcher](mockedMessageTextToQuote))
				)
			)
				.toBeVisible()
				.withTimeout(3000);
			await tapBack();
		});
	});

	describe('Login as UserB, get keys and send a message', () => {
		beforeAll(async () => {
			await loginAs(UserB);
		});

		it('should be able to read other messages', async () => {
			await navigateToRoom(room);
			await readMessages(3);
		});

		it('should send message and be able to read it', async () => {
			await mockMessage(getMessage(3));
		});
	});

	describe('Login as UserA, reset user e2ee key, reset room E2EE key and send a message', () => {
		beforeAll(async () => {
			await loginAs(UserA, false);
		});

		it('should reset user E2EE key, login again and recreate keys', async () => {
			await resetE2EEKey();
			await loginAs(UserA, false);
			await changeE2EEPassword();
		});

		it('should reset room E2EE key', async () => {
			await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true });
			await navigateToRoom(room);
			await waitFor(element(by.id('room-view-header-encryption')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('room-view-header-encryption')).tap();
			await waitFor(element(by.id('e2ee-toggle-room-view')))
				.toBeVisible()
				.withTimeout(2000);
			await waitFor(element(by.id('e2ee-toggle-room-reset-key')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('e2ee-toggle-room-reset-key')).tap();
			await waitFor(element(by[textMatcher]('Reset encryption key')))
				.toExist()
				.withTimeout(2000);
			await element(by[textMatcher]('Reset')).atIndex(0).tap();
			await waitForToast();
			await tapBack();
			await checkRoomTitle(room);
		});

		it('should send message and be able to read it', async () => {
			await mockMessage(getMessage(4));
		});
	});

	describe('Login as UserB, accept new room key, send a message and read everything', () => {
		beforeAll(async () => {
			await loginAs(UserB);
		});

		it('should send message and be able to read it', async () => {
			await navigateToRoom(room);
			await mockMessage(getMessage(5));
			await readMessages(4);
		});
	});

	// describe('Login as UserA, accept new room key, send a message and read everything', () => {
	// 	beforeAll(async () => {
	// 		await loginAs(UserA);
	// 	});

	// 	it('should send message and be able to read it', async () => {
	// 		await navigateToRoom(room);
	// 		await mockMessage(getMessage(6));
	// 		await readMessages(5);
	// 	});
	// });
});
