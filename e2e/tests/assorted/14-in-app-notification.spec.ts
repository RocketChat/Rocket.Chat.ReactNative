import { expect } from 'detox';

import data from '../../data';
import { navigateToLogin, login, sleep, tapBack } from '../../helpers/app';
import { sendMessage, post } from '../../helpers/data_setup';

describe('InApp Notification', () => {
	let dmCreatedRid: string;

	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
		const result = await post(`im.create`, { username: data.users.alternate.username });
		dmCreatedRid = result.data.room.rid;
	});

	describe('receive in RoomsListView', () => {
		const text = 'Message in DM';
		it('should have rooms list screen', async () => {
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});

		it('should send direct message from user alternate to user regular', async () => {
			await sleep(1000);
			await sendMessage(data.users.alternate, dmCreatedRid, text);
		});

		it('should tap on InApp Notification', async () => {
			await waitFor(element(by.id(`in-app-notification-${text}`)))
				.toExist()
				.withTimeout(2000);
			await sleep(500);
			await element(by.id(`in-app-notification-${text}`)).tap();
			await waitFor(element(by.id('room-view')))
				.toBeVisible()
				.withTimeout(5000);
			await expect(element(by.id(`room-view-title-${data.users.alternate.username}`))).toExist();
		});
	});

	describe('receive in another room', () => {
		const text = 'Another msg';
		it('should back to RoomsListView and open the channel Detox Public', async () => {
			await tapBack();
			await sleep(500);
			await element(by.id(`rooms-list-view-item-${data.userRegularChannels.detoxpublic.name}`)).tap();
			await waitFor(element(by.id('room-view')))
				.toBeVisible()
				.withTimeout(5000);
			await expect(element(by.id(`room-view-title-${data.userRegularChannels.detoxpublic.name}`))).toExist();
		});

		it('should receive and tap InAppNotification in another room', async () => {
			await sendMessage(data.users.alternate, dmCreatedRid, text);
			await waitFor(element(by.id(`in-app-notification-${text}`)))
				.toExist()
				.withTimeout(2000);
			await sleep(500);
			await element(by.id(`in-app-notification-${text}`)).tap();
			await sleep(500);
			await expect(element(by.id('room-header'))).toExist();
			await expect(element(by.id(`room-view-title-${data.users.alternate.username}`))).toExist();
		});

		it('should back to RoomsListView', async () => {
			await tapBack();
			await sleep(500);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});
	});
});
