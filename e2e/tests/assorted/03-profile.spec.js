const {
	device, expect, element, by, waitFor
} = require('detox');
const { navigateToLogin, login, sleep } = require('../../helpers/app');
const data = require('../../data');

const platformTypes = require('../../helpers/platformTypes');
const { closeKeyboardAndroid, prepareAndroid } = require('../../helpers/platformFunctions');

const profileChangeUser = data.users.profileChanges

const scrollDown = 200;

async function waitForToast() {
	// await waitFor(element(by.id('toast'))).toBeVisible().withTimeout(1000);
	// await expect(element(by.id('toast'))).toBeVisible();
	// await waitFor(element(by.id('toast'))).not.toBeNotVisible().withTimeout(1000);
	// await expect(element(by.id('toast'))).not.toBeVisible();
	await sleep(300);
}

describe('Profile screen', () => {
	let textInputType, scrollViewType;

	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await prepareAndroid();
		({ textInputType, scrollViewType } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(profileChangeUser.username, profileChangeUser.password);
		await element(by.id('rooms-list-view-sidebar')).tap();
		await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id('sidebar-profile'))).toBeVisible().withTimeout(2000);
		await element(by.id('sidebar-profile')).tap();
		await waitFor(element(by.id('profile-view'))).toBeVisible().withTimeout(2000);
	});

	describe('Render', async() => {
		it('should have profile view', async() => {
			await expect(element(by.id('profile-view'))).toBeVisible();
		});

		it('should have avatar', async() => {
			await expect(element(by.id('profile-view-avatar')).atIndex(0)).toExist();
		});

		it('should have name', async() => {
			await expect(element(by.id('profile-view-name'))).toExist();
		});

		it('should have username', async() => {
			await expect(element(by.id('profile-view-username'))).toExist();
		});

		it('should have email', async() => {
			await expect(element(by.id('profile-view-email'))).toExist();
		});

		it('should have new password', async() => {
			await expect(element(by.id('profile-view-new-password'))).toExist();
		});

		it('should have avatar url', async() => {
			await expect(element(by.id('profile-view-avatar-url'))).toExist();
		});
		
		it('should have reset avatar button', async() => {
			await waitFor(element(by.id('profile-view-reset-avatar'))).toExist().whileElement(by.id('profile-view-list')).scroll(scrollDown, 'down');
		});

		it('should have upload avatar button', async() => {
			await waitFor(element(by.id('profile-view-upload-avatar'))).toExist().whileElement(by.id('profile-view-list')).scroll(scrollDown, 'down');
		});

		it('should have avatar url button', async() => {
			await waitFor(element(by.id('profile-view-avatar-url-button'))).toExist().whileElement(by.id('profile-view-list')).scroll(scrollDown, 'down');
		});

		it('should have submit button', async() => {
			await waitFor(element(by.id('profile-view-submit'))).toExist().whileElement(by.id('profile-view-list')).scroll(scrollDown, 'down');
		});
	});

	describe('Usage', async() => {
		it('should change name and username', async() => {
			await element(by.id('profile-view-name')).replaceText(`${ profileChangeUser.username }new`);
			await element(by.id('profile-view-username')).typeText(`${ profileChangeUser.username }new`);
			await closeKeyboardAndroid();
			await element(by.type(scrollViewType)).atIndex(1).swipe('up');
			await element(by.id('profile-view-submit')).tap();
			await waitForToast();
		});

		it('should change email and password', async() => {
			await element(by.id('profile-view-email')).replaceText(`mobile+profileChangesNew${ data.random }@rocket.chat`);
			await element(by.id('profile-view-new-password')).replaceText(`${ profileChangeUser.password }new`);
			await element(by.id('profile-view-submit')).tap();
			await element(by.type(textInputType)).typeText(`${ profileChangeUser.password }\n`);
			await element(by.text('SAVE')).tap();
			await waitForToast();
		});

		it('should reset avatar', async() => {
			await element(by.type(scrollViewType)).atIndex(1).swipe('up');
			await element(by.id('profile-view-reset-avatar')).tap();
			await waitForToast();
		});
	});
});
