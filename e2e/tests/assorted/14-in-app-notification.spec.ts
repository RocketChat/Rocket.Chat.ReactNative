import { device, waitFor, element, by } from 'detox';

import { navigateToLogin, login, sleep, tapBack, navigateToRoom, checkRoomTitle } from '../../helpers/app';
import { sendMessage, post, ITestUser, createRandomUser, createRandomRoom } from '../../helpers/data_setup';

const waitForInAppNotificationAnimation = async () => {
	await sleep(500);
};

describe('InApp Notification', () => {
	let dmCreatedRid: string;
	let sender: ITestUser;
	let receiver: ITestUser;
	let room: string;

	beforeAll(async () => {
		sender = await createRandomUser();
		receiver = await createRandomUser();
		({ name: room } = await createRandomRoom(sender));
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(receiver.username, receiver.password);
		const result = await post('im.create', { username: sender.username }, receiver);
		dmCreatedRid = result.data.room.rid;
	});

	describe('receive in RoomsListView', () => {
		const text = 'Message in DM';
		it('should tap on InApp Notification', async () => {
			await sendMessage(sender, dmCreatedRid, text);
			await waitFor(element(by.id(`in-app-notification-${text}`)))
				.toBeVisible()
				.withTimeout(2000);
			await waitForInAppNotificationAnimation();
			await element(by.id(`in-app-notification-${text}`)).tap();
			await checkRoomTitle(sender.username);
			await tapBack();
		});
	});

	describe('receive in another room', () => {
		const text = 'Another msg';
		it('should receive and tap InAppNotification while in another room', async () => {
			await navigateToRoom(room);
			await sendMessage(sender, dmCreatedRid, text);
			await waitFor(element(by.id(`in-app-notification-${text}`)))
				.toExist()
				.withTimeout(2000);
			await waitForInAppNotificationAnimation();
			await element(by.id(`in-app-notification-${text}`)).tap();
			await checkRoomTitle(sender.username);
		});

		it('should tap back and go back to RoomsListView', async () => {
			await tapBack();
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(2000);
		});
	});
});
