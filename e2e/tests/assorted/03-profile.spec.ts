import { device, waitFor, element, by, expect } from 'detox';

import { navigateToLogin, login, sleep, platformTypes, TTextMatcher } from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';
import random from '../../helpers/random';

const scrollDown = 200;

async function waitForToast() {
	await sleep(600);
}

describe('Profile screen', () => {
	let scrollViewType: string;
	let textMatcher: TTextMatcher;
	let user: ITestUser;

	beforeAll(async () => {
		user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ scrollViewType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
		await element(by.id('rooms-list-view-sidebar')).tap();
		await waitFor(element(by.id('sidebar-view')))
			.toBeVisible()
			.withTimeout(2000);
		await waitFor(element(by.id('sidebar-profile')))
			.toBeVisible()
			.withTimeout(2000);
		await element(by.id('sidebar-profile')).tap();
		await waitFor(element(by.id('profile-view')))
			.toBeVisible()
			.withTimeout(2000);
	});

	describe('Render', () => {
		it('should have profile view', async () => {
			await expect(element(by.id('profile-view'))).toBeVisible();
		});

		it('should have avatar', async () => {
			await expect(element(by.id('profile-view-avatar')).atIndex(0)).toExist();
		});

		it('should have name', async () => {
			await expect(element(by.id('profile-view-name'))).toExist();
		});

		it('should have username', async () => {
			await expect(element(by.id('profile-view-username'))).toExist();
		});

		it('should have email', async () => {
			await expect(element(by.id('profile-view-email'))).toExist();
		});

		it('should have new password', async () => {
			await expect(element(by.id('profile-view-new-password'))).toExist();
		});

		it('should have avatar url', async () => {
			await expect(element(by.id('profile-view-avatar-url'))).toExist();
		});

		it('should have reset avatar button', async () => {
			await waitFor(element(by.id('profile-view-reset-avatar')))
				.toExist()
				.whileElement(by.id('profile-view-list'))
				.scroll(scrollDown, 'down');
		});

		it('should have upload avatar button', async () => {
			await waitFor(element(by.id('profile-view-upload-avatar')))
				.toExist()
				.whileElement(by.id('profile-view-list'))
				.scroll(scrollDown, 'down');
		});

		it('should have avatar url button', async () => {
			await waitFor(element(by.id('profile-view-avatar-url-button')))
				.toExist()
				.whileElement(by.id('profile-view-list'))
				.scroll(scrollDown, 'down');
		});

		it('should have submit button', async () => {
			await waitFor(element(by.id('profile-view-submit')))
				.toExist()
				.whileElement(by.id('profile-view-list'))
				.scroll(scrollDown, 'down');
		});
	});

	describe('Usage', () => {
		it('should change name and username', async () => {
			await element(by.id('profile-view-name')).replaceText(`${user.username}new`);
			await element(by.id('profile-view-username')).replaceText(`${user.username}new`);
			await element(by.id('profile-view-list')).swipe('down');
			await element(by.id('profile-view-submit')).tap();
			await waitForToast();
		});

		it('should change email and password', async () => {
			await waitFor(element(by.id('profile-view-email')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('profile-view-email')).replaceText(`mobile+profileChangesNew${random()}@rocket.chat`);
			await element(by.id('profile-view-new-password')).replaceText(`${user.password}new`);
			await waitFor(element(by.id('profile-view-submit')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('profile-view-submit')).tap();
			await waitFor(element(by.id('profile-view-enter-password-sheet')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('profile-view-enter-password-sheet')).replaceText(`${user.password}`);
			await element(by[textMatcher]('Save').withAncestor(by.id('action-sheet-content-with-input-and-submit')))
				.atIndex(0)
				.tap();
			await waitForToast();
		});

		it('should reset avatar', async () => {
			await element(by.type(scrollViewType)).atIndex(1).swipe('up');
			await element(by.id('profile-view-reset-avatar')).tap();
			await waitForToast();
		});
	});
});
