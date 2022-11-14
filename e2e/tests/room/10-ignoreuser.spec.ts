import { expect } from 'detox';

import data from '../../data';
import { navigateToLogin, login, searchRoom, sleep, platformTypes, TTextMatcher, tapBack } from '../../helpers/app';
import { sendMessage } from '../../helpers/data_setup';

async function navigateToRoom(user: string) {
	await searchRoom(`${user}`);
	await element(by.id(`rooms-list-view-item-${user}`)).tap();
	await waitFor(element(by.id('room-view')))
		.toBeVisible()
		.withTimeout(5000);
}

async function navigateToInfoView() {
	await element(by.id('room-header')).tap();
	await waitFor(element(by.id('room-actions-view')))
		.toExist()
		.withTimeout(5000);
	await element(by.id('room-actions-info')).tap();
	await waitFor(element(by.id('room-info-view')))
		.toExist()
		.withTimeout(2000);
}

describe('Ignore/Block User', () => {
	const user = data.users.alternate.username;
	let textMatcher: TTextMatcher;

	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
	});

	describe('Usage', () => {
		describe('Block user from DM', () => {
			it('should go to user info view', async () => {
				await navigateToRoom(user);
				await navigateToInfoView();
			});
			it('should block user', async () => {
				await waitFor(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Block user'))))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('room-info-view-ignore')).tap();
				await waitFor(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Unblock user'))))
					.toExist()
					.withTimeout(2000);
				await tapBack();
				await waitFor(element(by.id('room-actions-view')))
					.toBeVisible()
					.withTimeout(5000);
				await tapBack();
				await expect(element(by[textMatcher]('This room is blocked'))).toExist();
			});

			it('should unblock user', async () => {
				await navigateToInfoView();
				await element(by.id('room-info-view-ignore')).tap();
				await expect(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Block user')))).toExist();
				await tapBack();
				await waitFor(element(by.id('room-actions-view')))
					.toBeVisible()
					.withTimeout(5000);
				await tapBack();
				await expect(element(by.id('messagebox'))).toBeVisible();
				await tapBack();
			});
		});
		describe('Ignore user from Message', () => {
			it('should ignore user from message', async () => {
				const channelName = data.userRegularChannels.detoxpublic.name;
				await navigateToRoom(channelName);
				await sleep(300);
				await sendMessage(data.users.alternate, channelName, 'message-01');
				await sendMessage(data.users.alternate, channelName, 'message-02');
				await waitFor(element(by[textMatcher](user)).atIndex(0))
					.toExist()
					.withTimeout(30000);
				await sleep(300);
				await element(by[textMatcher](user)).atIndex(0).tap();
				await expect(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Ignore')))).toExist();
				await element(by.id('room-info-view-ignore')).tap();
				await expect(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Unignore')))).toExist();
				await tapBack();
			});
			it('should tap to display message', async () => {
				await expect(element(by[textMatcher]('Message ignored. Tap to display it.')).atIndex(0)).toExist();
				await element(by[textMatcher]('Message ignored. Tap to display it.')).atIndex(0).tap();
				await waitFor(element(by[textMatcher](user)))
					.toBeVisible()
					.withTimeout(1000);
				await element(by[textMatcher](user)).atIndex(0).tap();
				await expect(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Unignore')))).toExist();
				await element(by.id('room-info-view-ignore')).tap();
				await expect(element(by.id('room-info-view-ignore').withDescendant(by[textMatcher]('Ignore')))).toExist();
				await tapBack();
				await expect(element(by[textMatcher]('message-02')).atIndex(0)).toBeVisible();
			});
		});
	});
});
