import { device, waitFor, element, by, expect } from 'detox';

import { login, mockMessage, navigateToLogin, navigateToRoom } from '../../helpers/app';
import { createRandomRoom, createRandomUser, ITestUser } from '../../helpers/data_setup';

const navigateToAccessibilityAndAppearance = async () => {
	await waitFor(element(by.id('rooms-list-view-sidebar')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-accessibility')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('sidebar-accessibility')).tap();
};

const navigateToRoomListView = async () => {
	await waitFor(element(by.id('accessibility-view-drawer')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('accessibility-view-drawer')).tap();
	await waitFor(element(by.id('sidebar-chats')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('sidebar-chats')).tap();
};

const goBackToRoomList = async () => {
	await waitFor(element(by.id('header-back')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('header-back')).tap();
};

describe('Accessibility and Appearance', () => {
	let room: string;
	let user: ITestUser;

	beforeAll(async () => {
		user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ name: room } = await createRandomRoom(user));
		await navigateToLogin();
		await login(user.username, user.password);
		await navigateToAccessibilityAndAppearance();
	});

	describe('Render', () => {
		it('should have accessibility view list', async () => {
			await expect(element(by.id('accessibility-view-list'))).toBeVisible();
		});

		it('should have menu button', async () => {
			await expect(element(by.id('accessibility-view-drawer'))).toBeVisible();
		});

		it('should have theme button', async () => {
			await expect(element(by.id('accessibility-theme-button'))).toBeVisible();
		});

		it('should have display button', async () => {
			await expect(element(by.id('accessibility-display-button'))).toBeVisible();
		});

		it('should have rooms with hashtag symbol switch', async () => {
			await expect(element(by.id('accessibility-rooms-with-hashtag-symbol-switch'))).toBeVisible();
		});

		it('should have mentions with at symbol switch', async () => {
			await expect(element(by.id('accessibility-mentions-with-at-symbol-switch'))).toBeVisible();
		});

		it('should have autoplay gifs switch', async () => {
			await expect(element(by.id('accessibility-autoplay-gifs-switch'))).toBeVisible();
		});
	});

	describe('Usage', () => {
		it('should enable mentions with @ symbol', async () => {
			await waitFor(element(by.id('accessibility-mentions-with-at-symbol-switch')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('accessibility-mentions-with-at-symbol-switch')).tap();
			await navigateToRoomListView();
			await navigateToRoom(room);
			await mockMessage('@all');
			await waitFor(element(by.text('@all')))
				.toBeVisible()
				.withTimeout(300);
		});

		it('should disable mentions with @ symbol', async () => {
			await goBackToRoomList();
			await navigateToAccessibilityAndAppearance();
			await waitFor(element(by.id('accessibility-mentions-with-at-symbol-switch')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('accessibility-mentions-with-at-symbol-switch')).tap();
			await navigateToRoomListView();
			await navigateToRoom(room);
			await waitFor(element(by.text('all')))
				.toBeVisible()
				.withTimeout(300);
		});

		it('should enable rooms with # symbol', async () => {
			await goBackToRoomList();
			await navigateToAccessibilityAndAppearance();
			await waitFor(element(by.id('accessibility-rooms-with-hashtag-symbol-switch')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('accessibility-rooms-with-hashtag-symbol-switch')).tap();
			await navigateToRoomListView();
			await navigateToRoom(room);
			await mockMessage('#general');
			await waitFor(element(by.text('#general')))
				.toBeVisible()
				.withTimeout(300);
		});

		it('should disable rooms with # symbol', async () => {
			await goBackToRoomList();
			await navigateToAccessibilityAndAppearance();
			await waitFor(element(by.id('accessibility-rooms-with-hashtag-symbol-switch')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('accessibility-rooms-with-hashtag-symbol-switch')).tap();
			await navigateToRoomListView();
			await navigateToRoom(room);
			await waitFor(element(by.text('general')))
				.toBeVisible()
				.withTimeout(300);
		});
	});
});
