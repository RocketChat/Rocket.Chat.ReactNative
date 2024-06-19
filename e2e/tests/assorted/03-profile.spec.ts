import { device, waitFor, element, by, expect } from 'detox';

import { navigateToLogin, login, sleep, platformTypes, TTextMatcher } from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';
import random from '../../helpers/random';

const scrollDown = 200;

async function waitForToast() {
	await sleep(600);
}

async function dismissKeyboardAndScrollUp() {
	await element(by.id('profile-view-list')).swipe('down');
	await sleep(300);
	await element(by.id('profile-view-list')).swipe('up');
}

describe('Profile screen', () => {
	let textMatcher: TTextMatcher;
	let user: ITestUser;

	beforeAll(async () => {
		user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ textMatcher } = platformTypes[device.getPlatform()]);
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

		it('should have avatar edit button', async () => {
			await expect(element(by.id('avatar-edit-button'))).toExist();
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
			await dismissKeyboardAndScrollUp();
			await element(by.id('profile-view-submit')).tap();
			await waitForToast();
		});

		it('should change nickname and bio', async () => {
			await element(by.id('profile-view-nickname')).replaceText(`nickname-${user.username}`);
			await element(by.id('profile-view-bio')).replaceText(`bio-${user.username}`);
			await dismissKeyboardAndScrollUp();
			await element(by.id('profile-view-submit')).tap();
			await waitForToast();
		});

		it('should change email and password', async () => {
			await element(by.id('profile-view-list')).swipe('down');
			await waitFor(element(by.id('profile-view-email')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('profile-view-email')).replaceText(`mobile+profileChangesNew${random()}@rocket.chat`);
			await dismissKeyboardAndScrollUp();
			await element(by.id('profile-view-new-password')).replaceText(`${user.password}new`);
			await waitFor(element(by.id('profile-view-submit')))
				.toExist()
				.withTimeout(10000);
			await element(by.id('profile-view-submit')).tap();
			await waitFor(element(by.id('profile-view-enter-password-sheet-input')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('profile-view-enter-password-sheet-input')).replaceText(`${user.password}`);
			await element(by[textMatcher]('Save').withAncestor(by.id('action-sheet-content-with-input-and-submit')))
				.atIndex(0)
				.tap();
			await waitForToast();
		});
	});
});
