import { expect } from 'detox';

import data from '../../data';
import {
	navigateToLogin,
	login,
	mockMessage,
	tapBack,
	sleep,
	searchRoom,
	platformTypes,
	dismissReviewNag,
	TTextMatcher
} from '../../helpers/app';

async function navigateToRoom(roomName: string) {
	await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
	await navigateToLogin();
	await login(data.users.regular.username, data.users.regular.password);
	await searchRoom(`${roomName}`);
	await element(by.id(`rooms-list-view-item-${roomName}`)).tap();
	await waitFor(element(by.id(`room-view-title-${roomName}`)))
		.toExist()
		.withTimeout(5000);
}

describe('Threads', () => {
	const mainRoom = data.groups.private.name;
	let textMatcher: TTextMatcher;

	before(async () => {
		({ textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToRoom(mainRoom);
	});

	describe('Render', () => {
		it('should have room screen', async () => {
			await waitFor(element(by.id(`room-view-title-${mainRoom}`)))
				.toExist()
				.withTimeout(5000);
		});

		// Render - Header
		describe('Header', () => {
			it('should have actions button ', async () => {
				await expect(element(by.id('room-header'))).toExist();
			});

			it('should have threads button ', async () => {
				await expect(element(by.id('room-view-header-threads'))).toExist();
			});
		});

		// Render - Messagebox
		describe('Messagebox', () => {
			it('should have messagebox', async () => {
				await expect(element(by.id('messagebox'))).toExist();
			});

			it('should have open emoji button', async () => {
				if (device.getPlatform() === 'android') {
					await expect(element(by.id('messagebox-open-emoji'))).toExist();
				}
			});

			it('should have message input', async () => {
				await expect(element(by.id('messagebox-input'))).toExist();
			});

			it('should have audio button', async () => {
				await expect(element(by.id('messagebox-send-audio'))).toExist();
			});

			it('should have actions button', async () => {
				await expect(element(by.id('messagebox-actions'))).toExist();
			});
		});
	});

	describe('Usage', () => {
		describe('Thread', () => {
			const thread = `${data.random}thread`;
			it('should create thread', async () => {
				await mockMessage('thread');
				await element(by[textMatcher](thread)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by[textMatcher]('Reply in Thread')).atIndex(0).tap();
				await element(by.id('messagebox-input')).replaceText('replied');
				await waitFor(element(by.id('messagebox-send-message')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('messagebox-send-message')).tap();
				await waitFor(element(by.id(`message-thread-button-${thread}`)))
					.toExist()
					.withTimeout(5000);
				await expect(element(by.id(`message-thread-button-${thread}`))).toExist();
			});

			it('should navigate to thread from button', async () => {
				await element(by.id(`message-thread-button-${thread}`)).tap();
				await waitFor(element(by.id(`room-view-title-${thread}`)))
					.toExist()
					.withTimeout(5000);
				await expect(element(by.id(`room-view-title-${thread}`))).toExist();
				await tapBack();
			});

			it('should toggle follow thread', async () => {
				await element(by.id(`message-thread-button-${thread}`)).tap();
				await waitFor(element(by.id(`room-view-title-${thread}`)))
					.toExist()
					.withTimeout(5000);
				await element(by.id('room-view-header-unfollow')).tap();
				await waitFor(element(by.id('room-view-header-follow')))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id('room-view-header-follow'))).toExist();
				await element(by.id('room-view-header-follow')).tap();
				await waitFor(element(by.id('room-view-header-unfollow')))
					.toExist()
					.withTimeout(60000);
				await expect(element(by.id('room-view-header-unfollow'))).toExist();
			});

			it('should send message in thread only', async () => {
				const messageText = 'threadonly';
				await mockMessage(messageText, true);
				await tapBack();
				await waitFor(element(by.id(`room-view-title-${data.random}thread`)))
					.not.toExist()
					.withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${mainRoom}`)))
					.toExist()
					.withTimeout(5000);
				await waitFor(element(by[textMatcher](`${data.random}${messageText}`)).atIndex(0))
					.toNotExist()
					.withTimeout(2000);
			});

			it('should mark send to channel and show on main channel', async () => {
				const messageText = 'sendToChannel';
				await element(by.id(`message-thread-button-${thread}`)).tap();
				await waitFor(element(by.id('messagebox-input-thread')))
					.toExist()
					.withTimeout(5000);
				await element(by.id('messagebox-input-thread')).replaceText(messageText);
				await element(by.id('messagebox-send-to-channel')).tap();
				await element(by.id('messagebox-send-message')).tap();
				await tapBack();
				await waitFor(element(by.id(`room-view-title-${data.random}thread`)))
					.not.toExist()
					.withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${mainRoom}`)))
					.toExist()
					.withTimeout(5000);
				await waitFor(element(by[textMatcher](messageText)).atIndex(0))
					.toExist()
					.withTimeout(2000);
			});

			it('should navigate to thread from thread name', async () => {
				const messageText = 'navthreadname';
				await mockMessage('dummymessagebetweenthethread'); // TODO: Create a proper test for this elsewhere.
				await dismissReviewNag();
				await element(by.id(`message-thread-button-${thread}`)).tap();
				await waitFor(element(by.id('messagebox-input-thread')))
					.toExist()
					.withTimeout(5000);
				await element(by.id('messagebox-input-thread')).replaceText(messageText);
				await element(by.id('messagebox-send-to-channel')).tap();
				await element(by.id('messagebox-send-message')).tap();
				await tapBack();
				await waitFor(element(by.id(`room-view-title-${data.random}thread`)))
					.not.toExist()
					.withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${mainRoom}`)))
					.toExist()
					.withTimeout(5000);
				await waitFor(element(by.id(`message-thread-replied-on-${thread}`)))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id(`message-thread-replied-on-${thread}`)).tap();
				await waitFor(element(by.id(`room-view-title-${thread}`)))
					.toExist()
					.withTimeout(5000);
				await expect(element(by.id(`room-view-title-${thread}`))).toExist();
				await sleep(2000);
				await tapBack();
			});

			it('should navigate to thread from threads view', async () => {
				await waitFor(element(by.id('room-view-header-threads')))
					.toExist()
					.withTimeout(1000);
				await element(by.id('room-view-header-threads')).tap();
				await waitFor(element(by.id('thread-messages-view')))
					.toExist()
					.withTimeout(5000);
				await element(by.id(`thread-messages-view-${thread}`))
					.atIndex(0)
					.tap();
				await waitFor(element(by.id(`room-view-title-${thread}`)))
					.toExist()
					.withTimeout(5000);
				await expect(element(by.id(`room-view-title-${thread}`))).toExist();
				await tapBack();
				await waitFor(element(by.id('thread-messages-view')))
					.toExist()
					.withTimeout(5000);
				await expect(element(by.id('thread-messages-view'))).toExist();
				await tapBack();
			});

			it('should draft thread message', async () => {
				await element(by.id(`message-thread-button-${thread}`)).tap();
				await waitFor(element(by.id(`room-view-title-${thread}`)))
					.toExist()
					.withTimeout(5000);
				await element(by.id('messagebox-input-thread')).replaceText(`${thread}draft`);
				await tapBack();

				await element(by.id(`message-thread-button-${thread}`)).tap();
				await waitFor(element(by.id(`room-view-title-${thread}`)))
					.toExist()
					.withTimeout(5000);
				await expect(element(by.id('messagebox-input-thread'))).toHaveText(`${thread}draft`);
				await element(by.id('messagebox-input-thread')).clearText();
				await tapBack();

				await element(by.id(`message-thread-button-${thread}`)).tap();
				await waitFor(element(by.id(`room-view-title-${thread}`)))
					.toExist()
					.withTimeout(5000);
				await expect(element(by.id('messagebox-input-thread'))).toHaveText('');
			});
		});
	});
});
