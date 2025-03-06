import { device, waitFor, element, by, expect } from 'detox';

import {
	TTextMatcher,
	navigateToLogin,
	login,
	tapBack,
	navigateToRoom,
	platformTypes,
	mockMessage,
	sleep,
	checkRoomTitle
} from '../../helpers/app';
import { createRandomRoom, createRandomUser, ITestUser } from '../../helpers/data_setup';
import random from '../../helpers/random';

describe('Discussion', () => {
	let textMatcher: TTextMatcher;
	let user: ITestUser;
	let room: string;
	const discussionFromNewMessage = `${random()} Discussion NewMessageView`;
	const discussionFromMessageComposer = `${random()} Discussion MessageComposer actions`;
	let discussionFromActionSheet: string;
	beforeAll(async () => {
		user = await createRandomUser();
		({ name: room } = await createRandomRoom(user));
		await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
		({ textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
	});

	it('should create discussion from NewMessageView', async () => {
		const selectUser = 'rocket.cat';
		await waitFor(element(by.id('rooms-list-view-create-channel')))
			.toExist()
			.withTimeout(2000);
		await element(by.id('rooms-list-view-create-channel')).tap();
		await waitFor(element(by.id('new-message-view')))
			.toBeVisible()
			.withTimeout(2000);
		await waitFor(element(by.id('new-message-view-create-discussion')))
			.toBeVisible()
			.withTimeout(5000);
		await element(by[textMatcher]('Discussion')).atIndex(0).tap();
		await waitFor(element(by.id('create-discussion-view')))
			.toExist()
			.withTimeout(60000);
		await expect(element(by.id('create-discussion-view'))).toExist();
		await element(by[textMatcher]('Select a channel')).tap();
		await element(by.id('multi-select-search')).replaceText(`${room}`);
		await waitFor(element(by.id(`multi-select-item-${room}`)))
			.toExist()
			.withTimeout(10000);
		await element(by.id(`multi-select-item-${room}`)).tap();
		await element(by.id('multi-select-discussion-name')).replaceText(discussionFromNewMessage);
		await element(by[textMatcher]('Select users')).tap();
		await element(by.id('multi-select-search')).replaceText(`${selectUser}`);
		await waitFor(element(by.id(`multi-select-item-${selectUser}`)))
			.toExist()
			.withTimeout(10000);
		await element(by.id(`multi-select-item-${selectUser}`)).tap();
		await sleep(300);
		// checking if the chip was placed properly
		await waitFor(element(by.id(`multi-select-chip-${selectUser}`)))
			.toExist()
			.withTimeout(10000);
		// should keep the same chip even when the user does a new research
		await element(by.id('multi-select-search')).replaceText(`user`);
		await waitFor(element(by.id(`multi-select-item-${selectUser}`)))
			.not.toExist()
			.withTimeout(10000);
		await waitFor(element(by.id(`multi-select-chip-${selectUser}`)))
			.toExist()
			.withTimeout(10000);
		await sleep(500);
		await element(by.id('multi-select-search')).tapReturnKey();
		await sleep(500);
		// removing the rocket.cat from the users
		await element(by.id(`multi-select-chip-${selectUser}`)).tap();
		await waitFor(element(by.id('create-discussion-submit')))
			.toExist()
			.withTimeout(10000);
		await element(by.id('create-discussion-submit')).tap();
		await waitFor(element(by.id('room-view')))
			.toExist()
			.withTimeout(10000);
		await waitFor(element(by.id(`room-view-title-${discussionFromNewMessage}`)))
			.toExist()
			.withTimeout(5000);
		await tapBack();
		await waitFor(element(by.id(`rooms-list-view-item-${discussionFromNewMessage}`)))
			.toExist()
			.withTimeout(5000);
	});

	it('should create discussion from MessageComposer Actions', async () => {
		await navigateToRoom(room);
		await element(by.id('message-composer-actions')).tap();
		await sleep(300); // wait for animation
		await waitFor(element(by.id('action-sheet')))
			.toBeVisible()
			.withTimeout(2000);
		await element(by[textMatcher]('Create discussion')).atIndex(0).tap();
		await waitFor(element(by.id('create-discussion-view')))
			.toExist()
			.withTimeout(2000);
		await element(by.id('multi-select-discussion-name')).replaceText(discussionFromMessageComposer);
		await waitFor(element(by.id('create-discussion-submit')))
			.toExist()
			.withTimeout(10000);
		await element(by.id('create-discussion-submit')).tap();
		await waitFor(element(by.id('room-view')))
			.toExist()
			.withTimeout(10000);
		await waitFor(element(by.id(`room-view-title-${discussionFromMessageComposer}`)))
			.toExist()
			.withTimeout(5000);
	});

	describe('Create Discussion from action sheet', () => {
		it('should send a message', async () => {
			await waitFor(element(by.id('message-composer')))
				.toBeVisible()
				.withTimeout(60000);
			discussionFromActionSheet = await mockMessage('message');
		});

		it('should create discussion', async () => {
			await element(by[textMatcher](discussionFromActionSheet)).atIndex(0).tap();
			await element(by[textMatcher](discussionFromActionSheet)).atIndex(0).longPress();
			await sleep(1000); // wait for animation
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await element(by[textMatcher]('Start a discussion')).atIndex(0).tap();
			await sleep(1000); // wait for animation
			await waitFor(element(by.id('create-discussion-view')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('create-discussion-submit')).tap();
			await sleep(1000); // wait for animation
			await checkRoomTitle(discussionFromActionSheet);
		});
	});

	describe('Check RoomActionsView render', () => {
		it('should navigate to RoomActionsView', async () => {
			await waitFor(element(by.id('room-header')))
				.toBeVisible()
				.withTimeout(5000);
			await element(by.id('room-header')).tap();
			await waitFor(element(by.id('room-actions-view')))
				.toBeVisible()
				.withTimeout(5000);
		});

		it('should have room actions screen', async () => {
			await expect(element(by.id('room-actions-view'))).toBeVisible();
		});

		it('should have info', async () => {
			await expect(element(by.id('room-actions-info'))).toBeVisible();
		});

		it('should have members', async () => {
			await expect(element(by.id('room-actions-members'))).toBeVisible();
		});

		it('should have files', async () => {
			await expect(element(by.id('room-actions-files'))).toBeVisible();
		});

		it('should have mentions', async () => {
			await expect(element(by.id('room-actions-mentioned'))).toBeVisible();
		});

		it('should have starred', async () => {
			await element(by.id('room-actions-scrollview')).swipe('up', 'slow', 0.5);
			await expect(element(by.id('room-actions-starred'))).toBeVisible();
		});

		it('should have share', async () => {
			await element(by.id('room-actions-scrollview')).swipe('up');
			await expect(element(by.id('room-actions-share'))).toBeVisible();
		});

		it('should have pinned', async () => {
			await expect(element(by.id('room-actions-pinned'))).toBeVisible();
		});

		it('should not have notifications', async () => {
			await expect(element(by.id('room-actions-notifications'))).toBeVisible();
		});

		it('should not have leave channel', async () => {
			await expect(element(by.id('room-actions-leave-channel'))).toBeVisible();
		});

		it('should navigate to RoomActionView', async () => {
			await element(by.id('room-actions-scrollview')).swipe('down');
			await expect(element(by.id('room-actions-info'))).toBeVisible();
			await element(by.id('room-actions-info')).tap();
			await waitFor(element(by.id('room-info-view')))
				.toExist()
				.withTimeout(60000);
			await expect(element(by.id('room-info-view'))).toExist();
		});

		it('should have edit button', async () => {
			await expect(element(by.id('room-info-view-edit-button'))).toBeVisible();
		});
	});

	describe('Open Discussion from DiscussionsView', () => {
		it('should go back to main room', async () => {
			await tapBack();
			await waitFor(element(by.id('room-actions-view')))
				.toBeVisible()
				.withTimeout(5000);
			await tapBack();
			await waitFor(element(by.id(`room-view-title-${discussionFromActionSheet}`)))
				.toExist()
				.withTimeout(5000);
			await tapBack();
			await navigateToRoom(room);
		});

		it('should navigate to DiscussionsView', async () => {
			await waitFor(element(by.id('room-header')))
				.toBeVisible()
				.withTimeout(5000);
			await element(by.id('room-header')).tap();
			await waitFor(element(by.id('room-actions-discussions')))
				.toBeVisible()
				.withTimeout(5000);
			await element(by.id('room-actions-discussions')).tap();
			await waitFor(element(by.id('discussions-view')))
				.toBeVisible()
				.withTimeout(5000);
		});

		it('should navigate to discussion', async () => {
			await waitFor(element(by.label(discussionFromNewMessage)).atIndex(0))
				.toExist()
				.withTimeout(5000);
			await element(by.label(discussionFromNewMessage)).atIndex(0).tap();
			await waitFor(element(by.id(`room-view-title-${discussionFromNewMessage}`)))
				.toExist()
				.withTimeout(5000);
		});
	});
});
