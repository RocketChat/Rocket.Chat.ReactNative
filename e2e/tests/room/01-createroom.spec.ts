import { device, waitFor, element, by, expect } from 'detox';

import { tapBack, navigateToLogin, login, platformTypes, TTextMatcher, tapAndWaitFor, searchRoom } from '../../helpers/app';
import { createRandomUser } from '../../helpers/data_setup';
import random from '../../helpers/random';

describe('Create room screen', () => {
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	beforeAll(async () => {
		const user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
	});

	describe('New Message', () => {
		beforeAll(async () => {
			await waitFor(element(by.id('rooms-list-view-create-channel')))
				.toBeVisible()
				.withTimeout(10000);
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
			it('should back to rooms list', async () => {
				await waitFor(element(by.id('new-message-view-close')))
					.toBeVisible()
					.withTimeout(5000);
				await element(by.id('new-message-view-close')).tap();

				await waitFor(element(by.id('rooms-list-view')))
					.toBeVisible()
					.withTimeout(5000);

				await tapAndWaitFor(element(by.id('rooms-list-view-create-channel')), element(by.id('new-message-view')), 2000);
			});

			it('should search user and navigate', async () => {
				await element(by.id('new-message-view-search')).replaceText('rocket.cat');
				await waitFor(element(by.id('new-message-view-item-rocket.cat')))
					.toExist()
					.withTimeout(60000);
				await element(by.id('new-message-view-item-rocket.cat')).tap();
				await waitFor(element(by.id('room-view')))
					.toExist()
					.withTimeout(10000);
				await waitFor(element(by.id('room-view-title-rocket.cat')))
					.toExist()
					.withTimeout(60000);
				await tapBack();
				await waitFor(element(by.id('rooms-list-view')))
					.toExist()
					.withTimeout(5000);
			});

			it('should navigate to select users', async () => {
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view')))
					.toBeVisible()
					.withTimeout(5000);
				await waitFor(element(by.id('new-message-view-create-channel')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('new-message-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view')))
					.toExist()
					.withTimeout(5000);
			});
		});
	});

	describe('Select Users', () => {
		it('should search users', async () => {
			await element(by.id('select-users-view-search')).replaceText('rocket.cat');
			await waitFor(element(by.id('select-users-view-item-rocket.cat')))
				.toBeVisible()
				.withTimeout(10000);
		});

		it('should select/unselect user', async () => {
			// Spotlight issues
			await element(by.id('select-users-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('selected-user-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat')))
				.toBeNotVisible()
				.withTimeout(10000);
			// Spotlight issues
			await element(by.id('select-users-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat')))
				.toBeVisible()
				.withTimeout(10000);
		});

		it('should navigate to create channel view', async () => {
			await element(by.id('selected-users-view-submit')).tap();
			await waitFor(element(by.id('create-channel-view')))
				.toExist()
				.withTimeout(10000);
		});
	});

	describe('Create Channel', () => {
		describe('Render', () => {
			it('should render all fields', async () => {
				await expect(element(by.id('create-channel-name'))).toBeVisible();
				await expect(element(by.id('create-channel-type'))).toBeVisible();
				await expect(element(by.id('create-channel-readonly'))).toBeVisible();
				await expect(element(by.id('create-channel-broadcast'))).toBeVisible();
			});
		});

		describe('Usage', () => {
			it('should get invalid room', async () => {
				await element(by.id('create-channel-name')).replaceText('general');
				await element(by.id('create-channel-name')).tapReturnKey();
				await waitFor(element(by.id('create-channel-submit')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by[textMatcher]('A channel with name general exists')))
					.toExist()
					.withTimeout(60000);
				await expect(element(by[textMatcher]('A channel with name general exists'))).toExist();
				await element(by[textMatcher]('OK').and(by.type(alertButtonType))).tap();
			});

			it('should create public room', async () => {
				const room = `public${random()}`;
				await element(by.id('create-channel-name')).replaceText(room);
				await element(by.id('create-channel-name')).tapReturnKey();
				await element(by.id('create-channel-type')).tap();
				await waitFor(element(by.id('create-channel-submit')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view')))
					.toExist()
					.withTimeout(6000);
				await expect(element(by.id('room-view'))).toExist();
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toExist()
					.withTimeout(6000);
				await expect(element(by.id(`room-view-title-${room}`))).toExist();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view')))
					.toExist()
					.withTimeout(10000);
				await waitFor(element(by.id(`rooms-list-view-item-${room}`)))
					.toExist()
					.withTimeout(6000);
				await expect(element(by.id(`rooms-list-view-item-${room}`))).toExist();
			});

			it('should create private room', async () => {
				const room = `private${random()}`;
				await waitFor(element(by.id('rooms-list-view')))
					.toExist()
					.withTimeout(5000);
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view')))
					.toBeVisible()
					.withTimeout(5000);
				await waitFor(element(by.id('new-message-view-create-channel')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('new-message-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view')))
					.toExist()
					.withTimeout(5000);
				await element(by.id('select-users-view-item-rocket.cat')).tap();
				await waitFor(element(by.id('selected-user-rocket.cat')))
					.toExist()
					.withTimeout(5000);
				await element(by.id('selected-users-view-submit')).tap();
				await waitFor(element(by.id('create-channel-view')))
					.toBeVisible()
					.withTimeout(5000);
				await element(by.id('create-channel-name')).replaceText(room);
				await element(by.id('create-channel-name')).tapReturnKey();
				await waitFor(element(by.id('create-channel-submit')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view')))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id('room-view'))).toExist();
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id(`room-view-title-${room}`))).toExist();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view')))
					.toExist()
					.withTimeout(5000);
				await waitFor(element(by.id(`rooms-list-view-item-${room}`)))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id(`rooms-list-view-item-${room}`))).toExist();
			});

			it('should create empty room', async () => {
				const room = `empty${random()}`;
				await waitFor(element(by.id('rooms-list-view')))
					.toExist()
					.withTimeout(10000);
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view')))
					.toBeVisible()
					.withTimeout(5000);
				await waitFor(element(by.id('new-message-view-create-channel')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('new-message-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view')))
					.toExist()
					.withTimeout(5000);
				await element(by.id('selected-users-view-submit')).tap();
				await waitFor(element(by.id('create-channel-view')))
					.toExist()
					.withTimeout(10000);
				await waitFor(element(by.id('create-channel-name')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('create-channel-name')).replaceText(room);
				await element(by.id('create-channel-name')).tapReturnKey();
				await waitFor(element(by.id('create-channel-submit')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view')))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id('room-view'))).toExist();
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id(`room-view-title-${room}`))).toExist();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view')))
					.toExist()
					.withTimeout(2000);
				await waitFor(element(by.id(`rooms-list-view-item-${room}`)))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id(`rooms-list-view-item-${room}`))).toExist();
			});

			it('should create a room with non-latin alphabet and do a case insensitive search for it', async () => {
				const randomValue = random();
				const roomName = `ПРОВЕРКА${randomValue}`;
				const roomNameLower = roomName.toLowerCase();

				await waitFor(element(by.id('rooms-list-view')))
					.toExist()
					.withTimeout(10000);
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view')))
					.toBeVisible()
					.withTimeout(5000);
				await waitFor(element(by.id('new-message-view-create-channel')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('new-message-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view')))
					.toExist()
					.withTimeout(5000);
				await element(by.id('selected-users-view-submit')).tap();
				await waitFor(element(by.id('create-channel-view')))
					.toExist()
					.withTimeout(10000);
				await waitFor(element(by.id('create-channel-name')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('create-channel-name')).replaceText(roomName);
				await element(by.id('create-channel-name')).tapReturnKey();
				await waitFor(element(by.id('create-channel-submit')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view')))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id('room-view'))).toExist();
				await waitFor(element(by.id(`room-view-title-${roomName}`)))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id(`room-view-title-${roomName}`))).toExist();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view')))
					.toExist()
					.withTimeout(2000);
				await waitFor(element(by.id(`rooms-list-view-item-${roomName}`)))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id(`rooms-list-view-item-${roomName}`))).toExist();
				await searchRoom(roomNameLower, 'replaceText', `rooms-list-view-item-${roomName}`);
				await element(by.id(`rooms-list-view-item-${roomName}`)).tap();
				await waitFor(element(by.id('room-view')))
					.toBeVisible()
					.withTimeout(5000);
			});
		});
	});
});
