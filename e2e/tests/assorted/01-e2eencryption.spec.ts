import { device, waitFor, element, by, expect } from 'detox';

import {
	navigateToLogin,
	login,
	sleep,
	tapBack,
	searchRoom,
	logout,
	platformTypes,
	TTextMatcher,
	tapAndWaitFor,
	expectValidRegisterOrRetry,
	mockMessage
} from '../../helpers/app';
import data from '../../data';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';
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

async function navigateToRoom(roomName: string) {
	await searchRoom(`${roomName}`);
	await element(by.id(`rooms-list-view-item-${roomName}`)).tap();
	await waitFor(element(by.id('room-view')))
		.toBeVisible()
		.withTimeout(5000);
}

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

describe('E2E Encryption', () => {
	const room = `encrypted${random()}`;
	let user: ITestUser;
	let otherUser: ITestUser;
	let mockedMessageText: string;
	const newPassword = 'abc';

	let alertButtonType: string;
	let textMatcher: TTextMatcher;

	beforeAll(async () => {
		user = await createRandomUser();
		otherUser = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
	});

	describe('Banner', () => {
		describe('Render', () => {
			it('should have encryption badge', async () => {
				await checkBanner();
			});
		});

		describe('Usage', () => {
			it('should tap encryption badge and open save password modal', async () => {
				await element(by.id('listheader-encryption')).tap();
				await waitFor(element(by.id('e2e-save-password-view')))
					.toBeVisible()
					.withTimeout(2000);
			});

			it('should tap "How it works" and navigate', async () => {
				await element(by.id('e2e-save-password-view-how-it-works').and(by.label('How It Works'))).tap();
				await waitFor(element(by.id('e2e-how-it-works-view')))
					.toBeVisible()
					.withTimeout(2000);
				await tapBack();
			});

			it('should tap "Save my password" and close modal', async () => {
				await element(by.id('e2e-save-password-view-saved-password').and(by.label('I Saved My E2E Password'))).tap();
				await sleep(300); // wait for animation
				await waitFor(element(by.id('rooms-list-view')))
					.toBeVisible()
					.withTimeout(2000);
			});

			it('should create encrypted room', async () => {
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
				await element(by.id('create-channel-encrypted')).longPress();
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view')))
					.toBeVisible()
					.withTimeout(60000);
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toBeVisible()
					.withTimeout(60000);
			});

			it('should send message and be able to read it', async () => {
				mockedMessageText = await mockMessage('message');
				await tapBack();
			});
		});
	});

	describe('Security and Privacy', () => {
		it('should navigate to security privacy', async () => {
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
		});

		it('render', async () => {
			await expect(element(by.id('security-privacy-view-e2e-encryption'))).toExist();
			await expect(element(by.id('security-privacy-view-screen-lock'))).toExist();
			await expect(element(by.id('security-privacy-view-analytics-events'))).toExist();
			await expect(element(by.id('security-privacy-view-crash-report'))).toExist();
		});
	});

	describe('E2E Encryption Security', () => {
		it('should navigate to e2e encryption security', async () => {
			await element(by.id('security-privacy-view-e2e-encryption')).tap();
			await waitFor(element(by.id('e2e-encryption-security-view')))
				.toBeVisible()
				.withTimeout(2000);
		});

		describe('Render', () => {
			it('should have items', async () => {
				await waitFor(element(by.id('e2e-encryption-security-view')))
					.toBeVisible()
					.withTimeout(2000);
				await expect(element(by.id('e2e-encryption-security-view-password'))).toExist();
				await expect(element(by.id('e2e-encryption-security-view-change-password').and(by.label('Save Changes')))).toExist();
				await expect(element(by.id('e2e-encryption-security-view-reset-key').and(by.label('Reset E2E Key')))).toExist();
			});
		});

		describe('Change password', () => {
			it('should change password', async () => {
				await element(by.id('e2e-encryption-security-view-password')).replaceText(newPassword);
				await element(by.id('e2e-encryption-security-view-change-password')).tap();
				await waitFor(element(by[textMatcher]('Are you sure?')))
					.toExist()
					.withTimeout(2000);
				await expect(element(by[textMatcher]("Make sure you've saved it carefully somewhere else."))).toExist();
				await element(by[textMatcher]('Yes, change it')).atIndex(0).tap();
				await waitForToast();
			});

			it('should navigate to the room and messages should remain decrypted', async () => {
				await waitFor(element(by.id('e2e-encryption-security-view')))
					.toBeVisible()
					.withTimeout(2000);
				await tapBack();
				await waitFor(element(by.id('security-privacy-view')))
					.toBeVisible()
					.withTimeout(2000);
				await tapBack();
				await waitFor(element(by.id('settings-view')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('settings-view-drawer')).tap();
				await waitFor(element(by.id('sidebar-view')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('sidebar-chats')).tap();
				await waitFor(element(by.id('rooms-list-view')))
					.toBeVisible()
					.withTimeout(2000);
				await navigateToRoom(room);
				await waitFor(element(by[textMatcher](mockedMessageText)).atIndex(0))
					.toExist()
					.withTimeout(2000);
			});

			it('should logout, login and messages should be encrypted', async () => {
				await tapBack();
				await waitFor(element(by.id('rooms-list-view')))
					.toBeVisible()
					.withTimeout(2000);
				await logout();
				await navigateToLogin();
				await login(user.username, user.password);
				await navigateToRoom(room);
				await waitFor(element(by[textMatcher](mockedMessageText)).atIndex(0))
					.not.toExist()
					.withTimeout(2000);
				await expect(element(by.label('Encrypted message')).atIndex(0)).toExist();
			});

			it('should enter new e2e password and messages should be decrypted', async () => {
				await tapBack();
				await waitFor(element(by.id('rooms-list-view')))
					.toBeVisible()
					.withTimeout(2000);
				// TODO: assert 'Enter Your E2E Password'
				await waitFor(element(by.id('listheader-encryption')))
					.toBeVisible()
					.withTimeout(2000);
				await tapAndWaitFor(element(by.id('listheader-encryption')), element(by.id('e2e-enter-your-password-view')), 2000);
				await element(by.id('e2e-enter-your-password-view-password')).replaceText(newPassword);
				await element(by.id('e2e-enter-your-password-view-confirm')).tap();
				await waitFor(element(by.id('listheader-encryption')))
					.not.toExist()
					.withTimeout(10000);
				await navigateToRoom(room);
				await waitFor(element(by[textMatcher](mockedMessageText)).atIndex(0))
					.toExist()
					.withTimeout(2000);
			});
		});

		describe('Reset E2E key', () => {
			beforeAll(async () => {
				await tapBack();
				await waitFor(element(by.id('rooms-list-view')))
					.toBeVisible()
					.withTimeout(2000);
			});
			it('should reset e2e key', async () => {
				await navigateSecurityPrivacy();
				await element(by.id('security-privacy-view-e2e-encryption')).tap();
				await waitFor(element(by.id('e2e-encryption-security-view')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('e2e-encryption-security-view-reset-key').and(by.label('Reset E2E Key'))).tap();
				await waitFor(element(by[textMatcher]('Are you sure?')))
					.toExist()
					.withTimeout(2000);
				await expect(element(by[textMatcher]("You're going to be logged out."))).toExist();
				await element(by[textMatcher]('Yes, reset it').and(by.type(alertButtonType))).tap();
				await sleep(2000);

				// FIXME: The app isn't showing this alert anymore
				// await waitFor(element(by[textMatcher]("You've been logged out by the server. Please log in again.")))
				// 	.toExist()
				// 	.withTimeout(20000);
				// await element(by[textMatcher]('OK').and(by.type(alertButtonType))).tap();
				// await waitFor(element(by.id('workspace-view')))
				// 	.toBeVisible()
				// 	.withTimeout(10000);
				// await element(by.id('workspace-view-login')).tap();
				await navigateToLogin();
				await waitFor(element(by.id('login-view')))
					.toBeVisible()
					.withTimeout(2000);
				await login(user.username, user.password);
				// TODO: assert 'Save Your Encryption Password'
				await waitFor(element(by.id('listheader-encryption')))
					.toBeVisible()
					.withTimeout(5000);
			});
		});
	});

	describe('Persist Banner', () => {
		it('check save banner', async () => {
			await checkServer(data.server);
			await checkBanner();
		});

		it('should add server and create new user', async () => {
			await sleep(5000);
			await element(by.id('rooms-list-header-server-dropdown-button')).tap();
			await waitFor(element(by.id('rooms-list-header-server-dropdown')))
				.toBeVisible()
				.withTimeout(5000);
			await element(by.id('rooms-list-header-server-add')).tap();

			// TODO: refactor
			await waitFor(element(by.id('new-server-view')))
				.toBeVisible()
				.withTimeout(60000);
			await element(by.id('new-server-view-input')).replaceText(`${data.alternateServer}`);
			await element(by.id('new-server-view-input')).tapReturnKey();
			await waitFor(element(by.id('workspace-view')))
				.toBeVisible()
				.withTimeout(60000);
			await element(by.id('workspace-view-register')).tap();
			await waitFor(element(by.id('register-view')))
				.toBeVisible()
				.withTimeout(2000);

			// Register new user
			const randomUser = data.randomUser();
			await element(by.id('register-view-name')).replaceText(randomUser.username);
			await element(by.id('register-view-username')).replaceText(randomUser.username);
			await element(by.id('register-view-email')).replaceText(randomUser.email);
			await element(by.id('register-view-password')).replaceText(randomUser.password);
			await element(by.id('register-view-password')).tapReturnKey();
			await expectValidRegisterOrRetry(device.getPlatform());

			await checkServer(data.alternateServer);
		});

		it('should change back', async () => {
			await element(by.id('rooms-list-header-server-dropdown-button')).tap();
			await waitFor(element(by.id('rooms-list-header-server-dropdown')))
				.toBeVisible()
				.withTimeout(5000);
			await element(by.id(`rooms-list-header-server-${data.server}`)).tap();
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(10000);
			await checkServer(data.server);
			await checkBanner();
		});

		it('should reopen the app and have banner', async () => {
			await device.launchApp({
				permissions: { notifications: 'YES' },
				newInstance: true
			});
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(10000);
			await checkBanner();
		});
	});
});
