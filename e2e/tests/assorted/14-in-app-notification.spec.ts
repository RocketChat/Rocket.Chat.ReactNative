import data from '../../data';
import { navigateToLogin, login, sleep, tapBack, navigateToRoom, checkRoomTitle } from '../../helpers/app';
import { sendMessage, post } from '../../helpers/data_setup';

const waitForInAppNotificationAnimation = async () => {
	await sleep(500);
};

describe('InApp Notification', () => {
	let dmCreatedRid: string;

	beforeAll(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
		const result = await post('im.create', { username: data.users.alternate.username });
		dmCreatedRid = result.data.room.rid;
	});

	describe('receive in RoomsListView', () => {
		const text = 'Message in DM';
		it('should tap on InApp Notification', async () => {
			await sendMessage(data.users.alternate, dmCreatedRid, text);
			await waitFor(element(by.id(`in-app-notification-${text}`)))
				.toExist()
				.withTimeout(2000);
			await waitForInAppNotificationAnimation();
			await element(by.id(`in-app-notification-${text}`)).tap();
			await checkRoomTitle(data.users.alternate.username);
			await tapBack();
		});
	});

	describe('receive in another room', () => {
		const text = 'Another msg';
		it('should receive and tap InAppNotification while in another room', async () => {
			await navigateToRoom(data.userRegularChannels.detoxpublic.name);
			await sendMessage(data.users.alternate, dmCreatedRid, text);
			await waitFor(element(by.id(`in-app-notification-${text}`)))
				.toExist()
				.withTimeout(2000);
			await waitForInAppNotificationAnimation();
			await element(by.id(`in-app-notification-${text}`)).tap();
			await checkRoomTitle(data.users.alternate.username);
		});

		it('should tap back and go back to RoomsListView', async () => {
			await tapBack();
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(2000);
		});
	});
});
