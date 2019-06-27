const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { logout, navigateToLogin, login } = require('./helpers/app');
const data = require('./data');

const scrollDown = 200;

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

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', async() => {
		it('should change name and username', async() => {
			await element(by.id('profile-view-list')).swipe('down');
			await element(by.id('profile-view-name')).replaceText(`${ data.user }new`);
			await element(by.id('profile-view-username')).replaceText(`${ data.user }new`);
			await element(by.id('profile-view-list')).swipe('up');
			await element(by.id('profile-view-submit')).tap();
			await waitFor(element(by.text('Profile saved successfully!'))).toBeVisible().withTimeout(10000);
			// await expect(element(by.text('Profile saved successfully!'))).toBeVisible();
			await waitFor(element(by.text('Profile saved successfully!'))).toBeNotVisible().withTimeout(10000);
			await expect(element(by.text('Profile saved successfully!'))).toBeNotVisible();
		});

		it('should change email and password', async() => {
			await element(by.id('profile-view-email')).replaceText(`diego.mello+e2e${ data.random }test@rocket.chat`);
			await element(by.id('profile-view-new-password')).replaceText(`${ data.password }new`);
			await element(by.id('profile-view-submit')).tap();
			await waitFor(element(by.id('profile-view-typed-password'))).toBeVisible().withTimeout(10000);
			await expect(element(by.id('profile-view-typed-password'))).toBeVisible();
			await element(by.id('profile-view-typed-password')).replaceText(`${ data.password }`);
			await element(by.text('Save')).tap();
			await waitFor(element(by.text('Profile saved successfully!'))).toBeVisible().withTimeout(10000);
			// await expect(element(by.text('Profile saved successfully!'))).toBeVisible();
			await waitFor(element(by.text('Profile saved successfully!'))).toBeNotVisible().withTimeout(10000);
			await expect(element(by.text('Profile saved successfully!'))).toBeNotVisible();
		});

		it('should reset avatar', async() => {
			await element(by.id('profile-view-list')).swipe('up');
			await element(by.id('profile-view-reset-avatar')).tap();
			await waitFor(element(by.text('Avatar changed successfully!'))).toBeVisible().withTimeout(10000);
			// await expect(element(by.text('Avatar changed successfully!'))).toBeVisible();
			await waitFor(element(by.text('Avatar changed successfully!'))).toBeNotVisible().withTimeout(10000);
			await expect(element(by.text('Avatar changed successfully!'))).toBeNotVisible();
		});

		after(async() => {
			takeScreenshot();
		});
	});
});
