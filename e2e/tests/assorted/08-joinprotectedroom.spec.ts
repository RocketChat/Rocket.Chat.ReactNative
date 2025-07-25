import { device, waitFor, element, by, expect } from 'detox';

import data from '../../data';
import { navigateToLogin, login, searchRoom, mockMessage } from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';
import random from '../../helpers/random';

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
	// FIXME: this while is always matching 3 loops
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

// Skipped until we fix join code backend
describe.skip('Join protected room', () => {
	let user: ITestUser;

	beforeAll(async () => {
		user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(user.username, user.password);
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

		// Users on servers version 6.5 cannot access the protected room
		// TODO: remove the skip when the backend fixes the problem
		it.skip('should join room', async () => {
			await openJoinCode();
			await element(by.id('join-code-input')).replaceText(joinCode);
			await element(by.id('join-code-submit')).tap();
			await waitFor(element(by.id('join-code')))
				.toBeNotVisible()
				.withTimeout(5000);
			await waitFor(element(by.id('message-composer')))
				.toBeVisible()
				.withTimeout(60000);
			await expect(element(by.id('message-composer'))).toBeVisible();
			await expect(element(by.id('room-view-join'))).toBeNotVisible();
		});

		it.skip('should send message', async () => {
			await mockMessage(`${random()}message`);
		});
	});
});
