const {
	expect, element, by, waitFor
} = require('detox');
const { navigateToLogin, login, sleep, tapBack, mockMessage, searchRoom, logout } = require('../../helpers/app');

const data = require('../../data');

const testuser = data.users.regular
const otheruser = data.users.alternate

const checkServer = async(server) => {
	const label = `Connected to ${ server }`;
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
	await waitFor(element(by.label(label))).toBeVisible().withTimeout(60000);
	await element(by.id('sidebar-close-drawer')).tap();
}

const checkBanner = async() => {
	await waitFor(element(by.id('listheader-encryption').withDescendant(by.label('Save Your Encryption Password')))).toBeVisible().withTimeout(10000);
}

async function navigateToRoom(roomName) {
	await searchRoom(`${ roomName }`);
	await element(by.id(`rooms-list-view-item-${ roomName }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
}

async function waitForToast() {
	await sleep(300);
}

async function navigateSecurityPrivacy() {
	await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
	await waitFor(element(by.id('sidebar-settings'))).toBeVisible().withTimeout(2000);
	await element(by.id('sidebar-settings')).tap();
	await waitFor(element(by.id('settings-view'))).toBeVisible().withTimeout(2000);
	await element(by.id('settings-view-security-privacy')).tap();
	await waitFor(element(by.id('security-privacy-view'))).toBeVisible().withTimeout(2000);
}

describe('E2E Encryption', () => {
	const room = `encrypted${ data.random }`;
	const newPassword = 'abc';

	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(testuser.username, testuser.password);
	});

	describe('Banner', async() => {
		describe('Render', async () => {
			it('should have encryption badge', async () => {
				await checkBanner();
			});
		});
	
		describe('Usage', async () => {
			it('should tap encryption badge and open save password modal', async() => {
				await element(by.id('listheader-encryption')).tap();
				await waitFor(element(by.id('e2e-save-password-view'))).toBeVisible().withTimeout(2000);
			});
	
			it('should tap "How it works" and navigate', async() => {
				await element(by.id('e2e-save-password-view-how-it-works').and(by.label('How It Works'))).tap();
				await waitFor(element(by.id('e2e-how-it-works-view'))).toBeVisible().withTimeout(2000);
				await tapBack();
			});
			
			it('should tap "Save my password" and close modal', async() => {
				await element(by.id('e2e-save-password-view-saved-password').and(by.label('I Saved My E2E Password'))).tap();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			});
	
			it('should create encrypted room', async() => {
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view'))).toBeVisible().withTimeout(2000);
				await element(by.id('new-message-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
				await element(by.id('select-users-view-search')).replaceText(otheruser.username);
				await waitFor(element(by.id(`select-users-view-item-${ otheruser.username }`))).toBeVisible().withTimeout(60000);
				await element(by.id(`select-users-view-item-${ otheruser.username }`)).tap();
				await waitFor(element(by.id(`selected-user-${ otheruser.username }`))).toBeVisible().withTimeout(5000);
				await element(by.id('selected-users-view-submit')).tap();
				await waitFor(element(by.id('create-channel-view'))).toExist().withTimeout(5000);
				await element(by.id('create-channel-name')).replaceText(room);
				await element(by.id('create-channel-encrypted')).longPress();
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(60000);
				await waitFor(element(by.id(`room-view-title-${ room }`))).toBeVisible().withTimeout(60000);
			});
		
			it('should send message and be able to read it', async() => {
				await mockMessage('message');
				await tapBack();
			});
		});
	})

	describe('Security and Privacy', async() => {
		it('should navigate to security privacy', async() => {
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('rooms-list-view-sidebar')).tap();
			await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
			await waitFor(element(by.id('sidebar-settings'))).toBeVisible().withTimeout(2000);
			await element(by.id('sidebar-settings')).tap();
			await waitFor(element(by.id('settings-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('settings-view-security-privacy')).tap();
			await waitFor(element(by.id('security-privacy-view'))).toBeVisible().withTimeout(2000);
		});

		it('render', async() => {
			await expect(element(by.id('security-privacy-view-e2e-encryption'))).toExist();
			await expect(element(by.id('security-privacy-view-screen-lock'))).toExist();
			await expect(element(by.id('security-privacy-view-analytics-events'))).toExist();
			await expect(element(by.id('security-privacy-view-crash-report'))).toExist();
		});
	});

	describe('E2E Encryption Security', async() => {
		it('should navigate to e2e encryption security', async() => {
			await element(by.id('security-privacy-view-e2e-encryption')).tap();
			await waitFor(element(by.id('e2e-encryption-security-view'))).toBeVisible().withTimeout(2000);
		});

		describe('Render', () => {
			it('should have items', async() => {
				await waitFor(element(by.id('e2e-encryption-security-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('e2e-encryption-security-view-password'))).toExist();
				await expect(element(by.id('e2e-encryption-security-view-change-password').and(by.label('Save Changes')))).toExist();
				await expect(element(by.id('e2e-encryption-security-view-reset-key').and(by.label('Reset E2E Key')))).toExist();
			});
		})

		describe('Change password', async() => {
			it('should change password', async() => {
				await element(by.id('e2e-encryption-security-view-password')).typeText(newPassword);
				await element(by.id('e2e-encryption-security-view-change-password')).tap();
				await waitFor(element(by.text('Are you sure?'))).toExist().withTimeout(2000);
				await expect(element(by.text('Make sure you\'ve saved it carefully somewhere else.'))).toExist();
				await element(by.label('Yes, change it').and(by.type('_UIAlertControllerActionView'))).tap();
				await waitForToast();
			});

			it('should navigate to the room and messages should remain decrypted', async() => {
				await waitFor(element(by.id('e2e-encryption-security-view'))).toBeVisible().withTimeout(2000);
				await tapBack();
				await waitFor(element(by.id('security-privacy-view'))).toBeVisible().withTimeout(2000);
				await tapBack();
				await waitFor(element(by.id('settings-view'))).toBeVisible().withTimeout(2000);
				await element(by.id('settings-view-drawer')).tap();
				await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
				await element(by.id('sidebar-chats')).tap();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await navigateToRoom(room);
				await waitFor(element(by.label(`${ data.random }message`)).atIndex(0)).toExist().withTimeout(2000);
			});

			it('should logout, login and messages should be encrypted', async() => {
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await logout();
				await navigateToLogin();
				await login(testuser.username, testuser.password);
				await navigateToRoom(room);
				await waitFor(element(by.label(`${ data.random }message`)).atIndex(0)).not.toExist().withTimeout(2000);
				await expect(element(by.label('Encrypted message')).atIndex(0)).toExist();
			});

			it('should enter new e2e password and messages should be decrypted', async() => {
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await waitFor(element(by.id('listheader-encryption').withDescendant(by.label('Enter Your E2E Password')))).toBeVisible().withTimeout(2000);
				await element(by.id('listheader-encryption').withDescendant(by.label('Enter Your E2E Password'))).tap();
				await waitFor(element(by.id('e2e-enter-your-password-view'))).toBeVisible().withTimeout(2000);
				await element(by.id('e2e-enter-your-password-view-password')).typeText(newPassword);
				await element(by.id('e2e-enter-your-password-view-confirm')).tap();
				await waitFor(element(by.id('listheader-encryption'))).not.toExist().withTimeout(10000);
				await navigateToRoom(room);
				await waitFor(element(by.label(`${ data.random }message`)).atIndex(0)).toExist().withTimeout(2000);
			});
		});

		describe('Reset E2E key', async() => {
			it('should reset e2e key', async() => {
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await navigateSecurityPrivacy();
				await element(by.id('security-privacy-view-e2e-encryption')).tap();
				await waitFor(element(by.id('e2e-encryption-security-view'))).toBeVisible().withTimeout(2000);
				await element(by.id('e2e-encryption-security-view-reset-key').and(by.label('Reset E2E Key'))).tap();
				await waitFor(element(by.text('Are you sure?'))).toExist().withTimeout(2000);
				await expect(element(by.text('You\'re going to be logged out.'))).toExist();
				await element(by.label('Yes, reset it').and(by.type('UILabel'))).tap();
				await sleep(2000)
				await waitFor(element(by.id('workspace-view'))).toBeVisible().withTimeout(10000);
				await waitFor(element(by.text('You\'ve been logged out by the server. Please log in again.'))).toExist().withTimeout(2000);
				await element(by.label('OK').and(by.type('_UIAlertControllerActionView'))).tap();
				await element(by.id('workspace-view-login')).tap();
				await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
				await login(testuser.username, testuser.password);
				await waitFor(element(by.id('listheader-encryption').withDescendant(by.label('Save Your Encryption Password')))).toBeVisible().withTimeout(2000);
			})
		});
	});

	describe('Persist Banner', () => {
		it('check save banner', async() => {
			await checkServer(data.server);
			await checkBanner();
		})
	
		it('should add server and create new user', async() => {
			await sleep(5000);
			await element(by.id('rooms-list-header-server-dropdown-button')).tap();
			await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(5000);
			await element(by.id('rooms-list-header-server-add')).tap();
	
			// TODO: refactor
			await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(60000);
			await element(by.id('new-server-view-input')).typeText(`${data.alternateServer}\n`);
			await waitFor(element(by.id('workspace-view'))).toBeVisible().withTimeout(60000);
			await element(by.id('workspace-view-register')).tap();
			await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
	
			// Register new user
			await element(by.id('register-view-name')).replaceText(data.registeringUser.username);
			await element(by.id('register-view-username')).replaceText(data.registeringUser.username);
			await element(by.id('register-view-email')).replaceText(data.registeringUser.email);
			await element(by.id('register-view-password')).typeText(data.registeringUser.password);
			await element(by.id('register-view-submit')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
	
			await checkServer(data.alternateServer);
		});
	
		it('should change back', async() => {
			await element(by.id('rooms-list-header-server-dropdown-button')).tap();
			await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(5000);
			await element(by.id(`rooms-list-header-server-${ data.server }`)).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
			await checkServer(data.server);
			await checkBanner();
		});

		it('should reopen the app and have banner', async() => {
			await device.launchApp({
				permissions: { notifications: 'YES' },
				newInstance: true
			});
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
			await checkBanner();
		});
	});
});