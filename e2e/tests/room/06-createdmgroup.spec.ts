import { device, waitFor, element, by } from 'detox';

import { navigateToLogin, login, platformTypes, TTextMatcher } from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';

describe('Group DM', () => {
	let textMatcher: TTextMatcher;
	let otherUser: ITestUser;
	beforeAll(async () => {
		const user = await createRandomUser();
		otherUser = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
	});

	describe('Create Group DM', () => {
		beforeAll(async () => {
			await waitFor(element(by.id('rooms-list-view-create-channel')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('rooms-list-view-create-channel')).tap();
		});

		describe('Render', () => {
			it('should have new message screen', async () => {
				await waitFor(element(by.id('new-message-view')))
					.toBeVisible()
					.withTimeout(2000);
			});

			it('should have search input', async () => {
				await waitFor(element(by.id('new-message-view-search')))
					.toBeVisible()
					.withTimeout(2000);
			});
		});

		describe('Usage', () => {
			it('should navigate to create DM', async () => {
				await element(by[textMatcher]('Direct message')).atIndex(0).tap();
			});

			it('should add users', async () => {
				await element(by.id('select-users-view-search')).replaceText('rocket.cat');
				await waitFor(element(by.id('select-users-view-item-rocket.cat')))
					.toBeVisible()
					.withTimeout(10000);
				await element(by.id('select-users-view-item-rocket.cat')).tap();
				await element(by.id('select-users-view-search')).replaceText(otherUser.username);
				await waitFor(element(by.id(`select-users-view-item-${otherUser.username}`)))
					.toBeVisible()
					.withTimeout(10000);
				await element(by.id(`select-users-view-item-${otherUser.username}`)).tap();
				await element(by.id('selected-users-view-submit')).tap();
			});

			it('check Group DM exist', async () => {
				await waitFor(element(by.id(`room-view-title-rocket.cat, ${otherUser.username}`)))
					.toExist()
					.withTimeout(10000);
			});
		});
	});
});
