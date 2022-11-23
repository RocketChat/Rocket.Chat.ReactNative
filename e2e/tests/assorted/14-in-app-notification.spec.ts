import { expect } from 'detox';

import data from '../../data';
import { navigateToLogin, login, sleep } from '../../helpers/app';
import { sendMessage, post } from '../../helpers/data_setup';

describe('Room screen', () => {
	const text = 'Message in DM';

	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
	});

	describe('Render', () => {
		it('should have rooms list screen', async () => {
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});

		it('should send direct message from user alternate to user regular', async () => {
			const dmCreated = await post(`im.create`, { username: data.users.alternate.username });
			await sleep(1000);
			await sendMessage(data.users.alternate, dmCreated.data.room.rid, text);
			await waitFor(element(by.id(`in-app-notification-${text}`)))
				.toExist()
				.withTimeout(2000);
			await sleep(500);
			await element(by.id(`in-app-notification-${text}`)).tap();
			await sleep(500);
			await expect(element(by.id('room-header'))).toExist();
			await expect(element(by.id(`room-view-title-${data.users.alternate.username}`))).toExist();
		});
	});
});
