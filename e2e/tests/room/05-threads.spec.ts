import { device, waitFor, element, by, expect } from 'detox';

import {
	navigateToLogin,
	login,
	tapBack,
	sleep,
	platformTypes,
	TTextMatcher,
	tapAndWaitFor,
	navigateToRoom,
	mockMessage,
	tryTapping
} from '../../helpers/app';
import { createRandomRoom, createRandomUser } from '../../helpers/data_setup';

describe('Threads', () => {
	let room: string;
	let textMatcher: TTextMatcher;
	let alertButtonType: string;

	beforeAll(async () => {
		const user = await createRandomUser();
		({ name: room } = await createRandomRoom(user));
		({ textMatcher, alertButtonType } = platformTypes[device.getPlatform()]);
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(user.username, user.password);
		await navigateToRoom(room);
	});

	describe('Render', () => {
		it('should have room screen', async () => {
			await waitFor(element(by.id(`room-view-title-${room}`)))
				.toExist()
				.withTimeout(5000);
		});

		// Render - Header
		describe('Header', () => {
			it('should have actions button', async () => {
				await expect(element(by.id('room-header'))).toExist();
			});

			it('should have threads button', async () => {
				await expect(element(by.id('room-view-header-threads'))).toExist();
			});
		});
	});

	describe('Usage', () => {
		describe('Thread', () => {
			let thread: string;
			it('should create thread', async () => {
				thread = await mockMessage('thread');
				await element(by[textMatcher](thread)).atIndex(0).tap();
				await element(by[textMatcher](thread)).atIndex(0).longPress();
				await expect(element(by.id('action-sheet'))).toExist();
				await expect(element(by.id('action-sheet-handle'))).toBeVisible();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by[textMatcher]('Reply in thread')).atIndex(0).tap();
				await waitFor(element(by.id(`room-view-title-${thread}`)))
					.toExist()
					.withTimeout(5000);
				await element(by.id('message-composer-input-thread')).replaceText('replied');
				await waitFor(element(by.id('message-composer-send')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('message-composer-send')).tap();
				await waitFor(element(by[textMatcher]('replied')))
					.toExist()
					.withTimeout(60000);
				await element(by[textMatcher]('replied')).atIndex(0).tap();
			});

			it('should navigate to thread from button', async () => {
				await tapBack();
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toExist()
					.withTimeout(5000);
				await element(by.id(`message-thread-button-${thread}`)).tap();
				await waitFor(element(by.id(`room-view-title-${thread}`)))
					.toExist()
					.withTimeout(5000);
			});

			it('should toggle follow thread', async () => {
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
				const messageText = await mockMessage('threadonly', true);
				await tapBack();
				await waitFor(element(by.id(`room-view-title-${thread}`)))
					.not.toExist()
					.withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toExist()
					.withTimeout(5000);
				await waitFor(element(by[textMatcher](messageText)).atIndex(0))
					.toNotExist()
					.withTimeout(2000);
			});

			it('should mark send to channel and show on main channel', async () => {
				const messageText = 'sendToChannel';
				await element(by.id(`message-thread-button-${thread}`)).tap();
				await waitFor(element(by.id('message-composer-input-thread')))
					.toExist()
					.withTimeout(5000);
				await element(by.id('message-composer-input-thread')).replaceText(messageText);
				await element(by.id('message-composer-send-to-channel')).tap();
				await element(by.id('message-composer-send')).tap();
				await tapBack();
				await waitFor(element(by.id(`room-view-title-${thread}`)))
					.not.toExist()
					.withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toExist()
					.withTimeout(5000);
				await waitFor(element(by[textMatcher](messageText)).atIndex(0))
					.toExist()
					.withTimeout(2000);
			});

			it('should navigate to thread from thread name', async () => {
				const messageText = 'navthreadname';
				await mockMessage('dummymessagebetweenthethread');
				await element(by.id(`message-thread-button-${thread}`)).tap();
				await waitFor(element(by.id('message-composer-input-thread')))
					.toExist()
					.withTimeout(5000);
				await element(by.id('message-composer-input-thread')).replaceText(messageText);
				await element(by.id('message-composer-send-to-channel')).tap();
				await element(by.id('message-composer-send')).tap();
				await tapBack();
				await waitFor(element(by.id(`room-view-title-${thread}`)))
					.not.toExist()
					.withTimeout(5000);
				await waitFor(element(by.id(`room-view-title-${room}`)))
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
				await element(by.id('message-composer-input-thread')).replaceText(`${thread}draft`);
				await tapBack();

				await tapAndWaitFor(element(by.id(`message-thread-button-${thread}`)), element(by.id(`room-view-title-${thread}`)), 2000);
				await expect(element(by.id('message-composer-input-thread'))).toHaveText(`${thread}draft`);
				await element(by.id('message-composer-input-thread')).clearText();
				await tapBack();

				await tapAndWaitFor(element(by.id(`message-thread-button-${thread}`)), element(by.id(`room-view-title-${thread}`)), 2000);
				await expect(element(by.id('message-composer-input-thread'))).toHaveText('');
				await tapBack();
			});

			it('should create thread delete the message and the thread show the correct number of messages', async () => {
				thread = await mockMessage('thread-message-count');
				await element(by[textMatcher](thread)).atIndex(0).tap();
				await element(by[textMatcher](thread)).atIndex(0).longPress();
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await element(by[textMatcher]('Reply in thread')).atIndex(0).tap();
				await waitFor(element(by.id(`room-view-title-thread-message-count`)))
					.toExist()
					.withTimeout(5000);
				await element(by.id('message-composer-input-thread')).typeText('replied');
				await element(by.id('message-composer-send')).tap();
				await tryTapping(element(by[textMatcher]('replied')).atIndex(0), 2000, true);
				// Fix android flaky test. Close the action sheet, then re-open again
				await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
				await sleep(1000); // wait for animation
				await element(by.id('action-sheet')).swipe('up', 'fast', 0.5);
				await sleep(300); // wait for animation
				await element(by[textMatcher]('Delete')).atIndex(0).tap();
				await element(by[textMatcher]('Delete').and(by.type(alertButtonType))).tap();
				await tapBack();
				await waitFor(element(by.id(`thread-count-0`)))
					.toExist()
					.withTimeout(5000);
			});
		});
	});
});
