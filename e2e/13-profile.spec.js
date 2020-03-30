const {
	device, expect, element, by, waitFor
} = require('detox');
const { logout, navigateToLogin, login, sleep } = require('./helpers/app');
const data = require('./data');

const scrollDown = 200;

async function waitForToast() {
	// await waitFor(element(by.id('toast'))).toBeVisible().withTimeout(10000);
	// await expect(element(by.id('toast'))).toBeVisible();
	// await waitFor(element(by.id('toast'))).toBeNotVisible().withTimeout(10000);
	// await expect(element(by.id('toast'))).toBeNotVisible();
	await sleep(5000);
}

describe('Profile screen', () => {
	before(async() => {
		await element(by.id('rooms-list-view-sidebar')).tap();
		await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id('sidebar-profile'))).toBeVisible().withTimeout(2000);
		// await expect(element(by.id('sidebar-profile'))).toBeVisible();
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

		it('should have custom status', async() => {
			await expect(element(by.id('profile-view-custom-status'))).toExist();
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
			await expect(element(by.id('profile-view-reset-avatar'))).toExist();
		});

		it('should have upload avatar button', async() => {
			await waitFor(element(by.id('profile-view-upload-avatar'))).toExist().whileElement(by.id('profile-view-list')).scroll(scrollDown, 'down');
			await expect(element(by.id('profile-view-upload-avatar'))).toExist();
		});

		it('should have avatar url button', async() => {
			await waitFor(element(by.id('profile-view-avatar-url-button'))).toExist().whileElement(by.id('profile-view-list')).scroll(scrollDown, 'down');
			await expect(element(by.id('profile-view-avatar-url-button'))).toExist();
		});

		it('should have submit button', async() => {
			await waitFor(element(by.id('profile-view-submit'))).toExist().whileElement(by.id('profile-view-list')).scroll(scrollDown, 'down');
			await expect(element(by.id('profile-view-submit'))).toExist();
		});
	});

	describe('Usage', async() => {
		it('should change custom status', async() => {
			await element(by.type('UIScrollView')).atIndex(1).swipe('down');
			await element(by.id('profile-view-custom-status')).replaceText(`${ data.user }new`);
			await sleep(1000);
			await element(by.type('UIScrollView')).atIndex(1).swipe('up');
			await sleep(1000);
			await element(by.id('profile-view-submit')).tap();
			await waitForToast();
		});

		it('should change name and username', async() => {
			await element(by.type('UIScrollView')).atIndex(1).swipe('down');
			await element(by.id('profile-view-name')).replaceText(`${ data.user }new`);
			await element(by.id('profile-view-username')).replaceText(`${ data.user }new`);
			await sleep(1000);
			await element(by.type('UIScrollView')).atIndex(1).swipe('up');
			await sleep(1000);
			await element(by.id('profile-view-submit')).tap();
			await waitForToast();
		});

		it('should change email and password', async() => {
			await element(by.id('profile-view-email')).replaceText(`diego.mello+e2e${ data.random }test@rocket.chat`);
			await element(by.id('profile-view-new-password')).replaceText(`${ data.password }new`);
			await element(by.id('profile-view-submit')).tap();
			await element(by.type('_UIAlertControllerTextField')).replaceText(`${ data.password }`)
			// For some reason, replaceText does some type of submit, which submits the alert for us
			// await element(by.label('Save').and(by.type('_UIAlertControllerActionView'))).tap();
			await waitForToast();
		});

		it('should reset avatar', async() => {
			await element(by.type('UIScrollView')).atIndex(1).swipe('up');
			await sleep(1000);
			await element(by.id('profile-view-reset-avatar')).tap();
			await waitForToast();
		});
	});
});
