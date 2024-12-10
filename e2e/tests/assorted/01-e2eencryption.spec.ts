import { device, waitFor, element, by, expect } from 'detox';

import {
	navigateToLogin,
	login,
	sleep,
	tapBack,
	logout,
	platformTypes,
	TTextMatcher,
	tapAndWaitFor,
	expectValidRegisterOrRetry,
	mockMessage,
	tryTapping,
	navigateToRoom,
	checkRoomTitle
} from '../../helpers/app';
import data from '../../data';
import { createRandomUser, deleteCreatedUsers, IDeleteCreateUser, ITestUser } from '../../helpers/data_setup';
import random from '../../helpers/random';

const checkServer = async (server: string) => {
	const label = `Connected to ${server}`;
	await waitFor(element(by.id('rooms-list-view-sidebar')))
		.toBeVisible()
		.withTimeout(10000);
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-view')))
		.toBeVisible()
		.withTimeout(2000);
	await waitFor(element(by.label(label)))
		.toBeVisible()
		.withTimeout(60000);
	await element(by.id('sidebar-close-drawer')).tap();
};

const checkBanner = async () => {
	// TODO: Assert 'Save Your Encryption Password'
	await waitFor(element(by.id('listheader-encryption')))
		.toExist()
		.withTimeout(10000);
};

async function waitForToast() {
	await sleep(300);
}

async function navigateSecurityPrivacy() {
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
}

// Prepare stuff
// Login as UserB
// Save e2ee password
// change e2ee password ***
// Login as UserA
// Save e2ee password
// change e2ee password ***

// Create channel with UserA
// Enviar mensagem
// Login as UserB
// Enviar mensagem

// Login as UserA
// Reset user key
// Login as UserA
// Reset room key
// Send message
// Login as UserB
// Send message and read all the others

// change password
// banner stuff

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

	// afterAll(async () => {
	// 	await deleteCreatedUsers(deleteUsersAfterAll);
	// });

	describe('Create room as UserA and send a message', () => {
		it('should create encrypted room', async () => {
			await device.launchApp({ permissions: { notifications: 'YES' } });
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
			await loginAs(UserB);
		});

		// it('should reset room E2EE key', async () => {
		// 	await navigateToRoom(room);
		// 	// await waitFor(element(by.id('room-view-header-encryption')))
		// 	// 	.toBeVisible()
		// 	// 	.withTimeout(2000);
		// 	// await element(by.id('room-view-header-encryption')).tap();
		// 	// await waitFor(element(by.id('e2ee-toggle-room-view')))
		// 	// 	.toBeVisible()
		// 	// 	.withTimeout(2000);
		// 	// await waitFor(element(by.id('e2ee-toggle-room-reset-key')))
		// 	// 	.toBeVisible()
		// 	// 	.withTimeout(2000);
		// 	// await element(by.id('e2ee-toggle-room-reset-key')).tap();
		// 	// await waitFor(element(by[textMatcher]('Reset encryption key')))
		// 	// 	.toExist()
		// 	// 	.withTimeout(2000);
		// 	// await element(by[textMatcher]('Reset')).atIndex(0).tap();
		// 	// await waitForToast();
		// 	// await tapBack();
		// 	// await checkRoomTitle(room);
		// });

		// it('should send message and be able to read it', async () => {
		// 	await mockMessage(getMessage(4));
		// });
	});

	// describe('Security and Privacy', () => {
	// 	it('should navigate to security privacy', async () => {
	// 		await waitFor(element(by.id('rooms-list-view')))
	// 			.toBeVisible()
	// 			.withTimeout(2000);
	// 		await element(by.id('rooms-list-view-sidebar')).tap();
	// 		await waitFor(element(by.id('sidebar-view')))
	// 			.toBeVisible()
	// 			.withTimeout(2000);
	// 		await waitFor(element(by.id('sidebar-settings')))
	// 			.toBeVisible()
	// 			.withTimeout(2000);
	// 		await element(by.id('sidebar-settings')).tap();
	// 		await waitFor(element(by.id('settings-view')))
	// 			.toBeVisible()
	// 			.withTimeout(2000);
	// 		await element(by.id('settings-view-security-privacy')).tap();
	// 		await waitFor(element(by.id('security-privacy-view')))
	// 			.toBeVisible()
	// 			.withTimeout(2000);
	// 	});

	// 	it('render', async () => {
	// 		await expect(element(by.id('security-privacy-view-e2e-encryption'))).toExist();
	// 		await expect(element(by.id('security-privacy-view-screen-lock'))).toExist();
	// 		await expect(element(by.id('security-privacy-view-analytics-events'))).toExist();
	// 		await expect(element(by.id('security-privacy-view-crash-report'))).toExist();
	// 	});
	// });

	// describe('E2E Encryption Security', () => {
	// 	it('should navigate to e2e encryption security', async () => {
	// 		await element(by.id('security-privacy-view-e2e-encryption')).tap();
	// 		await waitFor(element(by.id('e2e-encryption-security-view')))
	// 			.toBeVisible()
	// 			.withTimeout(2000);
	// 	});

	// 	describe('Render', () => {
	// 		it('should have items', async () => {
	// 			await waitFor(element(by.id('e2e-encryption-security-view')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 			await expect(element(by.id('e2e-encryption-security-view-password'))).toExist();
	// 			await expect(element(by.id('e2e-encryption-security-view-change-password'))).toExist();
	// 			await expect(element(by.id('e2e-encryption-security-view-reset-key'))).toExist();
	// 		});
	// 	});

	// 	describe('Change password', () => {
	// 		it('should change password', async () => {
	// 			await element(by.id('e2e-encryption-security-view-password')).replaceText(newPassword);
	// 			await element(by.id('e2e-encryption-security-view-change-password')).tap();
	// 			await waitFor(element(by[textMatcher]('Are you sure?')))
	// 				.toExist()
	// 				.withTimeout(2000);
	// 			await expect(element(by[textMatcher]("Make sure you've saved it carefully somewhere else."))).toExist();
	// 			await element(by[textMatcher]('Yes, change it')).atIndex(0).tap();
	// 			await waitForToast();
	// 		});

	// 		it('should navigate to the room and messages should remain decrypted', async () => {
	// 			await waitFor(element(by.id('e2e-encryption-security-view')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 			await tapBack();
	// 			await waitFor(element(by.id('security-privacy-view')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 			await tapBack();
	// 			await waitFor(element(by.id('settings-view')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 			await element(by.id('settings-view-drawer')).tap();
	// 			await waitFor(element(by.id('sidebar-view')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 			await element(by.id('sidebar-chats')).tap();
	// 			await waitFor(element(by.id('rooms-list-view')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 			await navigateToRoom(room);
	// 			await waitFor(element(by[textMatcher](mockedMessageText)).atIndex(0))
	// 				.toExist()
	// 				.withTimeout(2000);
	// 		});

	// 		it('should logout, login and messages should be encrypted', async () => {
	// 			await tapBack();
	// 			await waitFor(element(by.id('rooms-list-view')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 			await logout();
	// 			await navigateToLogin();
	// 			await login(UserA.username, UserA.password);
	// 			await navigateToRoom(room);
	// 			await waitFor(element(by[textMatcher](mockedMessageText)).atIndex(0))
	// 				.not.toExist()
	// 				.withTimeout(2000);
	// 			await waitFor(element(by.id('room-view-encrypted-room')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 		});

	// 		it('should enter new e2e password and messages should be decrypted', async () => {
	// 			await tapBack();
	// 			await waitFor(element(by.id('rooms-list-view')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 			// TODO: assert 'Enter E2EE Password'
	// 			await waitFor(element(by.id('listheader-encryption')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 			await tapAndWaitFor(element(by.id('listheader-encryption')), element(by.id('e2e-enter-your-password-view')), 2000);
	// 			await element(by.id('e2e-enter-your-password-view-password')).replaceText(newPassword);
	// 			await element(by.id('e2e-enter-your-password-view-confirm')).tap();
	// 			await waitFor(element(by.id('listheader-encryption')))
	// 				.not.toExist()
	// 				.withTimeout(10000);
	// 			await navigateToRoom(room);
	// 			await waitFor(element(by[textMatcher](mockedMessageText)).atIndex(0))
	// 				.toExist()
	// 				.withTimeout(2000);
	// 		});
	// 	});

	// 	describe('Reset E2E key', () => {
	// 		beforeAll(async () => {
	// 			await tapBack();
	// 			await waitFor(element(by.id('rooms-list-view')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 		});
	// 		it('should reset e2e key', async () => {
	// 			await navigateSecurityPrivacy();
	// 			await element(by.id('security-privacy-view-e2e-encryption')).tap();
	// 			await waitFor(element(by.id('e2e-encryption-security-view')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 			await element(by.id('e2e-encryption-security-view-reset-key')).tap();
	// 			await waitFor(element(by[textMatcher]('Are you sure?')))
	// 				.toExist()
	// 				.withTimeout(2000);
	// 			await expect(element(by[textMatcher]("You're going to be logged out."))).toExist();
	// 			await element(by[textMatcher]('Yes, reset it').and(by.type(alertButtonType))).tap();
	// 			await sleep(2000);

	// 			// FIXME: The app isn't showing this alert anymore
	// 			// await waitFor(element(by[textMatcher]("You've been logged out by the server. Please log in again.")))
	// 			// 	.toExist()
	// 			// 	.withTimeout(20000);
	// 			// await element(by[textMatcher]('OK').and(by.type(alertButtonType))).tap();
	// 			// await waitFor(element(by.id('workspace-view')))
	// 			// 	.toBeVisible()
	// 			// 	.withTimeout(10000);
	// 			// await element(by.id('workspace-view-login')).tap();
	// 			await navigateToLogin();
	// 			await waitFor(element(by.id('login-view')))
	// 				.toBeVisible()
	// 				.withTimeout(2000);
	// 			await login(UserA.username, UserA.password);
	// 			// TODO: assert 'Save Your Encryption Password'
	// 			await waitFor(element(by.id('listheader-encryption')))
	// 				.toBeVisible()
	// 				.withTimeout(5000);
	// 		});
	// 	});
	// });

	// describe('Persist Banner', () => {
	// 	it('check save banner', async () => {
	// 		await checkServer(data.server);
	// 		await checkBanner();
	// 	});

	// 	it('should add server and create new user', async () => {
	// 		await sleep(5000);
	// 		await element(by.id('rooms-list-header-servers-list-button')).tap();
	// 		await waitFor(element(by.id('rooms-list-header-servers-list')))
	// 			.toBeVisible()
	// 			.withTimeout(5000);
	// 		await element(by.id('rooms-list-header-server-add')).tap();

	// 		// TODO: refactor
	// 		await waitFor(element(by.id('new-server-view')))
	// 			.toBeVisible()
	// 			.withTimeout(60000);
	// 		await element(by.id('new-server-view-input')).replaceText(`${data.alternateServer}`);
	// 		await element(by.id('new-server-view-input')).tapReturnKey();
	// 		await waitFor(element(by.id('workspace-view')))
	// 			.toBeVisible()
	// 			.withTimeout(60000);
	// 		await element(by.id('workspace-view-register')).tap();
	// 		await waitFor(element(by.id('register-view')))
	// 			.toBeVisible()
	// 			.withTimeout(2000);

	// 		// Register new user
	// 		const randomUser = data.randomUser();
	// 		await element(by.id('register-view-name')).replaceText(randomUser.name);
	// 		await element(by.id('register-view-name')).tapReturnKey();
	// 		await element(by.id('register-view-username')).replaceText(randomUser.username);
	// 		await element(by.id('register-view-username')).tapReturnKey();
	// 		await element(by.id('register-view-email')).replaceText(randomUser.email);
	// 		await element(by.id('register-view-email')).tapReturnKey();
	// 		await element(by.id('register-view-password')).replaceText(randomUser.password);
	// 		await element(by.id('register-view-password')).tapReturnKey();
	// 		await expectValidRegisterOrRetry(device.getPlatform());
	// 		deleteUsersAfterAll.push({ server: data.alternateServer, username: randomUser.username });

	// 		await checkServer(data.alternateServer);
	// 	});

	// 	it('should change back', async () => {
	// 		await waitFor(element(by.id('rooms-list-header-servers-list-button')))
	// 			.toExist()
	// 			.withTimeout(2000);
	// 		await element(by.id('rooms-list-header-servers-list-button')).tap();
	// 		await waitFor(element(by.id('rooms-list-header-servers-list')))
	// 			.toBeVisible()
	// 			.withTimeout(5000);
	// 		await element(by.id(`server-item-${data.server}`)).tap();
	// 		await waitFor(element(by.id('rooms-list-view')))
	// 			.toBeVisible()
	// 			.withTimeout(10000);
	// 		await checkServer(data.server);
	// 		await checkBanner();
	// 	});

	// 	it('should reopen the app and have banner', async () => {
	// 		await device.launchApp({
	// 			permissions: { notifications: 'YES' },
	// 			newInstance: true
	// 		});
	// 		await waitFor(element(by.id('rooms-list-view')))
	// 			.toBeVisible()
	// 			.withTimeout(10000);
	// 		await checkBanner();
	// 	});
	// });

	// // TODO: missing request e2ee room key
});
