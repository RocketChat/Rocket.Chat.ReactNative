import { expect } from 'detox';

import data from '../../data';
import { navigateToLogin, login, mockMessage, searchRoom } from '../../helpers/app';

const testuser = data.users.regular;
const room = data.channels.detoxpublicprotected.name;
const { joinCode } = data.channels.detoxpublicprotected;

async function navigateToRoom() {
	await searchRoom(room);
	await element(by.id(`rooms-list-view-item-${room}`)).tap();
	await waitFor(element(by.id('room-view')))
		.toExist()
		.withTimeout(5000);
}

async function openJoinCode() {
	await waitFor(element(by.id('room-view-join-button')))
		.toExist()
		.withTimeout(2000);
	let n = 0;
	while (n < 3) {
		try {
			await element(by.id('room-view-join-button')).tap();
			await waitFor(element(by.id('join-code')))
				.toBeVisible()
				.withTimeout(500);
		} catch (error) {
			n += 1;
		}
	}
}

describe('Join protected room', () => {
	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(testuser.username, testuser.password);
		await navigateToRoom();
	});

	describe('Usage', () => {
		it('should tap join and ask for join code', async () => {
			await openJoinCode();
		});

		it('should cancel join room', async () => {
			await element(by.id('join-code-cancel')).tap();
			await waitFor(element(by.id('join-code')))
				.toBeNotVisible()
				.withTimeout(5000);
		});

		it('should join room', async () => {
			await openJoinCode();
			await element(by.id('join-code-input')).replaceText(joinCode);
			await element(by.id('join-code-submit')).tap();
			await waitFor(element(by.id('join-code')))
				.toBeNotVisible()
				.withTimeout(5000);
			await waitFor(element(by.id('messagebox')))
				.toBeVisible()
				.withTimeout(60000);
			await expect(element(by.id('messagebox'))).toBeVisible();
			await expect(element(by.id('room-view-join'))).toBeNotVisible();
		});

		it('should send message', async () => {
			await mockMessage('message');
		});
	});
});
