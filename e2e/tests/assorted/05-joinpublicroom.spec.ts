import { device, waitFor, element, by, expect } from 'detox';

import data from '../../data';
import { navigateToLogin, login, tapBack, platformTypes, TTextMatcher, mockMessage, navigateToRoom } from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';
import random from '../../helpers/random';

const room = data.channels.detoxpublic.name;

async function navigateToRoomActions() {
	await element(by.id(`room-view-title-${room}`)).tap();
	await waitFor(element(by.id('room-actions-view')))
		.toBeVisible()
		.withTimeout(5000);
}

describe('Join public room', () => {
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	let user: ITestUser;

	beforeAll(async () => {
		user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
		await navigateToRoom(room);
	});

	describe('Render', () => {
		it('should have room screen', async () => {
			await expect(element(by.id('room-view'))).toBeVisible();
		});

		// Render - Header
		describe('Header', () => {
			it('should have actions button', async () => {
				await expect(element(by.id('room-header'))).toBeVisible();
			});
		});

		// Render - Join
		describe('Join', () => {
			it('should have join', async () => {
				await expect(element(by.id('room-view-join'))).toBeVisible();
			});

			it('should have join text', async () => {
				await expect(element(by.label('You are in preview mode'))).toBeVisible();
			});

			it('should have join button', async () => {
				await expect(element(by.id('room-view-join-button'))).toBeVisible();
			});

			it('should not have message composer', async () => {
				await expect(element(by.id('message-composer'))).toBeNotVisible();
			});
		});

		describe('Room Actions', () => {
			beforeAll(async () => {
				await navigateToRoomActions();
			});

			it('should have room actions screen', async () => {
				await expect(element(by.id('room-actions-view'))).toBeVisible();
			});

			it('should have info', async () => {
				await expect(element(by.id('room-actions-info'))).toBeVisible();
			});

			it('should have members', async () => {
				await waitFor(element(by.id('room-actions-members')))
					.toBeVisible()
					.withTimeout(2000);
			});

			it('should have files', async () => {
				await expect(element(by.id('room-actions-files'))).toBeVisible();
			});

			it('should have mentions', async () => {
				await expect(element(by.id('room-actions-mentioned'))).toBeVisible();
			});

			it('should have starred', async () => {
				await expect(element(by.id('room-actions-starred'))).toBeVisible();
			});

			it('should have share', async () => {
				await expect(element(by.id('room-actions-share'))).toBeVisible();
			});

			it('should have pinned', async () => {
				await expect(element(by.id('room-actions-pinned'))).toBeVisible();
			});

			it('should not have notifications', async () => {
				await expect(element(by.id('room-actions-notifications'))).toBeNotVisible();
			});

			it('should not have leave channel', async () => {
				await expect(element(by.id('room-actions-leave-channel'))).toBeNotVisible();
			});

			afterAll(async () => {
				await tapBack();
				await waitFor(element(by.id('room-view')))
					.toBeVisible()
					.withTimeout(2000);
			});
		});
	});

	describe('Usage', () => {
		it('should join room', async () => {
			await element(by.id('room-view-join-button')).tap();
			await waitFor(element(by.id('room-view-join-button')))
				.not.toBeVisible()
				.withTimeout(2000);
			await tapBack();
			await navigateToRoom(room);
			await waitFor(element(by.id('message-composer')))
				.toBeVisible()
				.withTimeout(10000);
			await expect(element(by.id('message-composer'))).toBeVisible();
			await expect(element(by.id('room-view-join'))).toBeNotVisible();
		});

		it('should send message', async () => {
			await mockMessage(`${random()}message`);
		});

		it('should have notifications and leave channel', async () => {
			await navigateToRoomActions();
			await expect(element(by.id('room-actions-view'))).toBeVisible();
			await expect(element(by.id('room-actions-info'))).toBeVisible();
			await expect(element(by.id('room-actions-members'))).toBeVisible();
			await expect(element(by.id('room-actions-files'))).toBeVisible();
			await expect(element(by.id('room-actions-mentioned'))).toBeVisible();
			await expect(element(by.id('room-actions-starred'))).toBeVisible();
			await expect(element(by.id('room-actions-share'))).toBeVisible();
			await expect(element(by.id('room-actions-pinned'))).toBeVisible();
			await expect(element(by.id('room-actions-notifications'))).toBeVisible();
			await element(by.id('room-actions-scrollview')).scrollTo('bottom');
			await expect(element(by.id('room-actions-leave-channel'))).toBeVisible();
		});

		it('should leave room', async () => {
			await element(by.id('room-actions-leave-channel')).tap();
			await waitFor(element(by[textMatcher]('Yes, leave it!').and(by.type(alertButtonType))))
				.toBeVisible()
				.withTimeout(5000);
			await element(by[textMatcher]('Yes, leave it!').and(by.type(alertButtonType))).tap();
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(10000);
			await waitFor(element(by.id(`rooms-list-view-item-${room}`)))
				.toBeNotVisible()
				.withTimeout(60000);
		});
	});
});
