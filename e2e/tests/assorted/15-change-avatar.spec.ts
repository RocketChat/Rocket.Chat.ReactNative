import { device, waitFor, element, by } from 'detox';

import { navigateToLogin, login, sleep, platformTypes, TTextMatcher, tapBack } from '../../helpers/app';
import { createRandomUser, getProfileInfo, ITestUser, login as loginSetup } from '../../helpers/data_setup';

describe('Change avatar', () => {
	let scrollViewType: string;
	let textMatcher: TTextMatcher;
	let user: ITestUser;
	let userId: string;

	beforeAll(async () => {
		user = await createRandomUser();
		const result = await loginSetup(user.username, user.password);
		userId = result.userId;
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

	describe('Usage', () => {
		it('should click on the reset avatar button', async () => {
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

		it('should appear the discard alert when click the back icon', async () => {
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
			await sleep(200);
		});

		it('should change the avatar through a base64 image mocked', async () => {
			await element(by.type(scrollViewType)).atIndex(1).swipe('down');
			await element(by.id('avatar-edit-button')).tap();
			const previousUserInfo = await getProfileInfo({ userId });
			const previousAvatarEtag = previousUserInfo.avatarETag;
			await sleep(500);
			await waitFor(element(by.id('change-avatar-view-upload-image')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('change-avatar-view-upload-image')).tap();
			await waitFor(element(by.id('change-avatar-view-submit')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('change-avatar-view-submit')).tap();
			await waitFor(element(by.id('profile-view')))
				.toBeVisible()
				.withTimeout(2000);
			await sleep(300);
			const newUserInfo = await getProfileInfo({ userId });
			const newAvatarEtag = newUserInfo.avatarETag;
			await sleep(500);
			if (previousAvatarEtag === newAvatarEtag) {
				throw new Error('Failed to update the avatar');
			}
		});

		it('should change the avatar taking a photo using a base64 image mocked', async () => {
			await element(by.type(scrollViewType)).atIndex(1).swipe('down');
			await element(by.id('avatar-edit-button')).tap();
			const previousUserInfo = await getProfileInfo({ userId });
			const previousAvatarEtag = previousUserInfo.avatarETag;
			await sleep(500);
			await waitFor(element(by.id('change-avatar-view-upload-image')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('change-avatar-view-upload-image')).tap();
			await waitFor(element(by.id('change-avatar-view-submit')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('change-avatar-view-submit')).tap();
			await waitFor(element(by.id('profile-view')))
				.toExist()
				.withTimeout(2000);
			await sleep(300);
			const newUserInfo = await getProfileInfo({ userId });
			const newAvatarEtag = newUserInfo.avatarETag;
			await sleep(500);
			if (previousAvatarEtag === newAvatarEtag) {
				throw new Error('Failed to update the avatar');
			}
		});
	});
});
