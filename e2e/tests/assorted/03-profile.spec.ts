import { device, waitFor, element, by, expect } from 'detox';

import { navigateToLogin, login, sleep, platformTypes, TTextMatcher, tapBack } from '../../helpers/app';
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

		it('should click to reset avatar', async () => {
			await element(by.type(scrollViewType)).atIndex(1).swipe('down');
			await element(by.id('avatar-edit-button')).tap();
			await waitFor(element(by.id('change-avatar-view-avatar')))
				.toBeVisible()
				.withTimeout(2000);
			await waitFor(element(by.id('reset-avatar-suggestion')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('reset-avatar-suggestion')).tap();
			await sleep(300);
		});

		it('should appear the discard alert when click the back icon ', async () => {
			await tapBack();
			await waitFor(element(by[textMatcher]('Discard changes?')).atIndex(0))
				.toBeVisible()
				.withTimeout(2000);
			await waitFor(element(by[textMatcher]('Cancel')).atIndex(0))
				.toBeVisible()
				.withTimeout(2000);
			await element(by[textMatcher]('Cancel')).atIndex(0).tap();
			await sleep(200);
			await tapBack();
			await waitFor(element(by[textMatcher]('Discard changes?')).atIndex(0))
				.toBeVisible()
				.withTimeout(2000);
			await waitFor(element(by[textMatcher]('Discard')).atIndex(0))
				.toBeVisible()
				.withTimeout(2000);
			await element(by[textMatcher]('Discard')).atIndex(0).tap();
		});

		it('should change the avatar through a base64 image mocked', async () => {
			await element(by.type(scrollViewType)).atIndex(1).swipe('down');
			await element(by.id('avatar-edit-button')).tap();
		});

		it('should enable the save button and submit the avatar', async () => {
			await waitFor(element(by.id('change-avatar-view-submit')))
				.toBeVisible()
				.withTimeout(2000);
		});
	});
});
