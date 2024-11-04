import { device, waitFor, element, by, expect } from 'detox';

import {
	navigateToLogin,
	login,
	tapBack,
	sleep,
	tryTapping,
	platformTypes,
	TTextMatcher,
	mockMessage,
	navigateToRoom,
	navigateToRecentRoom,
	checkMessage
} from '../../helpers/app';
import { createRandomRoom, createRandomUser, deleteCreatedUsers, ITestUser, sendMessage } from '../../helpers/data_setup';
import data from '../../data';

describe('Room screen', () => {
	let room: string;
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	let user: ITestUser;
	let randomMessage: string;

	beforeAll(async () => {
		user = await createRandomUser();
		({ name: room } = await createRandomRoom(user));
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
		await navigateToRoom(room);
	});

	describe('Composer', () => {
		it('should send message', async () => {
			randomMessage = await mockMessage('message');
		});

		it('should show and tap on emoji autocomplete', async () => {
			await element(by.id('message-composer-input')).typeText(':joy');
			await waitFor(element(by.id('autocomplete-item-joy')))
				.toExist()
				.withTimeout(10000);
			await element(by.id('autocomplete-item-joy')).tap();
			await expect(element(by.id('message-composer-input'))).toHaveText(':joy: ');
			await element(by.id('message-composer-input')).clearText();
		});

		it('should show and tap on user autocomplete and send mention', async () => {
			const { username } = user;
			await element(by.id('message-composer-input')).typeText(`@${username}`);
			await waitFor(element(by.id(`autocomplete-item-${username}`)))
				.toExist()
				.withTimeout(10000);
			await element(by.id(`autocomplete-item-${username}`)).tap();
			await expect(element(by.id('message-composer-input'))).toHaveText(`@${username} `);
			await element(by.id('message-composer-input')).clearText();
		});

		it('should show and tap on room autocomplete', async () => {
			await element(by.id('message-composer-input')).typeText('#general');
			await waitFor(element(by.id(`autocomplete-item-general`)))
				.toExist()
				.withTimeout(10000);
			await element(by.id(`autocomplete-item-general`)).tap();
			await expect(element(by.id('message-composer-input'))).toHaveText('#general ');
			await element(by.id('message-composer-input')).clearText();
		});
	});

	// describe('Emoji Keyboard', () => {
	// 	it('select an emoji', async () => {
	// 		await element(by.id('message-composer-input')).tap();
	// 		await waitFor(element(by.id('message-composer-open-emoji')))
	// 			.toBeVisible()
	// 			.withTimeout(2000);
	// 		await element(by.id('message-composer-open-emoji')).tap();

	// 		// TODO: change it after moved away from messabebox
	// 		await waitFor(element(by.id('message-composer-keyboard-emoji')))
	// 			.toExist()
	// 			.withTimeout(10000);
	// 		await waitFor(element(by.id('emoji-picker-tab-emoji')))
	// 			.toExist()
	// 			.withTimeout(10000);
	// 		await element(by.id('emoji-picker-tab-emoji')).tap();
	// 		await waitFor(element(by.id('emoji-blush')))
	// 			.toBeVisible()
	// 			.withTimeout(2000);
	// 		await element(by.id('emoji-blush')).tap();
	// 		await expect(element(by.id('message-composer-input'))).toHaveText('😊');
	// 		await element(by.id('message-composer-input')).clearText();
	// 	});

	// 	it('should search emoji', async () => {
	// 		await element(by.id('message-composer-input')).tap();
	// 		await element(by.id('message-composer-open-emoji')).tap();
	// 		await waitFor(element(by.id('emoji-picker-search')))
	// 			.toExist()
	// 			.withTimeout(4000);
	// 		await element(by.id('emoji-picker-search')).tap();
	// 		await waitFor(element(by.id('emoji-searchbar-input')))
	// 			.toExist()
	// 			.withTimeout(2000);
	// 		await element(by.id('emoji-searchbar-input')).replaceText('no_mouth');
	// 		await waitFor(element(by.id('emoji-no_mouth')))
	// 			.toExist()
	// 			.withTimeout(2000);
	// 		await element(by.id('emoji-no_mouth')).tap();
	// 		await expect(element(by.id('message-composer-input'))).toHaveText('😶');
	// 		await element(by.id('message-composer-input')).clearText();
	// 	});
	// });

	describe('Message', () => {
		// Commented out, since it's flaky and we're not asserting clipboard anyway
		// it('should copy link', async () => {
		// 	await element(by[textMatcher](randomMessage)).atIndex(0).longPress();
		// 	await sleep(300);
		// 	await waitFor(element(by.id('action-sheet')))
		// 		.toExist()
		// 		.withTimeout(2000);
		// 	await expect(element(by.id('action-sheet-handle'))).toBeVisible();
		// 	await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
		// 	await element(by[textMatcher]('Get link')).atIndex(0).tap();
		// 	// TODO: test clipboard
		// });
		// it('should copy message', async () => {
		// 	await element(by[textMatcher](randomMessage)).atIndex(0).longPress();
		// 	await sleep(300);
		// 	await waitFor(element(by.id('action-sheet')))
		// 		.toExist()
		// 		.withTimeout(2000);
		// 	await expect(element(by.id('action-sheet-handle'))).toBeVisible();
		// 	await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
		// 	await element(by[textMatcher]('Copy')).atIndex(0).tap();
		// 	// TODO: test clipboard
		// });

		it('should react to message', async () => {
			await waitFor(element(by[textMatcher](randomMessage)))
				.toExist()
				.withTimeout(60000);
			await element(by[textMatcher](randomMessage)).atIndex(0).tap();
			await element(by[textMatcher](randomMessage)).atIndex(0).longPress();
			await sleep(300); // wait for animation
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
			await element(by.id('add-reaction')).tap();
			await sleep(300); // wait for animation
			await waitFor(element(by.id('emoji-picker-tab-emoji')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('emoji-picker-tab-emoji')).tap();
			await waitFor(element(by.id('emoji-grinning')))
				.toExist()
				.withTimeout(10000);
			await element(by.id('emoji-grinning')).tap();
			await waitFor(element(by.id('message-reaction-:grinning:')))
				.toExist()
				.withTimeout(60000);
		});

		it('should search emojis in the reaction picker and react', async () => {
			await element(by[textMatcher](randomMessage)).atIndex(0).longPress();
			await sleep(300);
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await expect(element(by.id('action-sheet-handle'))).toBeVisible();
			await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
			await element(by.id('add-reaction')).tap();
			await waitFor(element(by.id('emoji-searchbar-input')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('emoji-searchbar-input')).replaceText('laughing');
			await waitFor(element(by.id('emoji-laughing')))
				.toExist()
				.withTimeout(4000);
			await element(by.id('emoji-laughing')).tap();
			await waitFor(element(by.id('message-reaction-:laughing:')))
				.toExist()
				.withTimeout(60000);
		});

		it('should remove reaction', async () => {
			await element(by.id('message-reaction-:grinning:')).tap();
			await waitFor(element(by.id('message-reaction-:grinning:')))
				.not.toExist()
				.withTimeout(60000);
		});

		it('should react to message with frequently used emoji', async () => {
			await element(by[textMatcher](randomMessage)).atIndex(0).longPress();
			await sleep(300);
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await expect(element(by.id('action-sheet-handle'))).toBeVisible();
			await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
			await sleep(300); // wait for animation
			await waitFor(element(by.id('message-actions-emoji-grinning')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('message-actions-emoji-grinning')).tap();
			await waitFor(element(by.id('message-reaction-:grinning:')))
				.toBeVisible()
				.withTimeout(60000);
		});

		it('should show reaction picker on add reaction button pressed and have frequently used emoji', async () => {
			await element(by.id('message-add-reaction')).tap();
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await expect(element(by.id('action-sheet-handle'))).toBeVisible();
			await element(by.id('action-sheet-handle')).swipe('up', 'fast', 1);
			await waitFor(element(by.id('emoji-grinning')))
				.toExist()
				.withTimeout(4000);
			await waitFor(element(by.id('emoji-picker-tab-emoji')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('emoji-picker-tab-emoji')).tap();
			await waitFor(element(by.id('emoji-wink')))
				.toExist()
				.withTimeout(10000);
			await element(by.id('emoji-wink')).tap();
			await waitFor(element(by.id('message-reaction-:wink:')))
				.toExist()
				.withTimeout(60000);
		});

		it('should open/close reactions list', async () => {
			await element(by.id('message-reaction-:laughing:')).longPress();
			await waitFor(element(by.id('reactionsList')))
				.toExist()
				.withTimeout(4000);
			await expect(element(by.id('action-sheet-handle'))).toBeVisible();
			await element(by.id('action-sheet-handle')).swipe('down', 'fast', 0.5);
		});

		it('should open the profile view tapping on his username', async () => {
			const { username } = user;
			await waitFor(element(by.id(`username-header-${username}`)))
				.toExist()
				.withTimeout(2000);
			await element(by.id(`username-header-${username}`)).tap();
			await waitFor(element(by.id('room-info-view-username')))
				.toExist()
				.withTimeout(2000);
			await waitFor(element(by[textMatcher](`@${username}`)))
				.toExist()
				.withTimeout(2000);
			await tapBack();
		});

		it('should open the profile view tapping on other username', async () => {
			const otherUser = await createRandomUser();
			const { username } = otherUser;
			await sendMessage(otherUser, room, 'new message');
			await waitFor(element(by.id(`username-header-${username}`)))
				.toExist()
				.withTimeout(2000);
			await element(by.id(`username-header-${username}`)).tap();
			await waitFor(element(by.id('room-info-view-username')))
				.toExist()
				.withTimeout(2000);
			await waitFor(element(by[textMatcher](`@${username}`)))
				.toExist()
				.withTimeout(2000);
			await tapBack();
			await deleteCreatedUsers([{ server: data.server, username }]);
		});

		it('should edit message', async () => {
			const editMessage = await mockMessage('edit');
			const editedMessage = `${editMessage}ed`;
			await tryTapping(element(by[textMatcher](editMessage)).atIndex(0), 2000, true);
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await expect(element(by.id('action-sheet-handle'))).toBeVisible();
			await sleep(300);
			await waitFor(element(by[textMatcher]('Edit')))
				.toBeVisible()
				.withTimeout(3000);
			await element(by[textMatcher]('Edit')).atIndex(0).tap();
			await element(by.id('message-composer-input')).typeText('ed');
			await element(by.id('message-composer-send')).tap();
			await waitFor(element(by[textMatcher](editedMessage)).atIndex(0))
				.toExist()
				.withTimeout(60000);
		});

		let quotedMessage = '';
		it('should quote message', async () => {
			const quoteMessage = await mockMessage('quote');
			quotedMessage = `${quoteMessage}d`;
			await tryTapping(element(by[textMatcher](quoteMessage)).atIndex(0), 2000, true);
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await expect(element(by.id('action-sheet-handle'))).toBeVisible();
			await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
			await element(by[textMatcher]('Quote')).atIndex(0).tap();
			await element(by.id('message-composer-input')).replaceText(quotedMessage);
			await waitFor(element(by.id('message-composer-send')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('message-composer-send')).tap();
			await waitFor(element(by[textMatcher](quotedMessage)).atIndex(0))
				.toBeVisible()
				.withTimeout(3000);
			await element(by[textMatcher](quotedMessage)).atIndex(0).tap();
			await waitFor(element(by.id(`reply-${user.name}-${quoteMessage}`).withDescendant(by[textMatcher](quoteMessage))))
				.toBeVisible()
				.withTimeout(3000);
		});

		it('should back to rooms list view and see the last message correctly and navigate again to room', async () => {
			const expectedLastMessage = `You: ${quotedMessage}`;
			await sleep(300);
			await tapBack();
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(5000);
			await waitFor(element(by.id(`markdown-preview-${expectedLastMessage}`)))
				.toBeVisible()
				.withTimeout(5000);
			await element(by.id(`markdown-preview-${expectedLastMessage}`)).tap();
		});

		it('should delete message', async () => {
			const deleteMessage = await mockMessage('delete');
			await tryTapping(element(by[textMatcher](deleteMessage)).atIndex(0), 2000, true);
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await expect(element(by.id('action-sheet-handle'))).toBeVisible();
			// Fix android flaky test. Close the action sheet, then re-open again
			await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
			await element(by.id('action-sheet')).swipe('up', 'fast', 0.5);
			await sleep(300); // wait for animation
			await waitFor(element(by[textMatcher]('Delete')))
				.toExist()
				.withTimeout(2000);
			await element(by[textMatcher]('Delete')).atIndex(0).tap();
			const deleteAlertMessage = 'You will not be able to recover this message!';
			await waitFor(element(by[textMatcher](deleteAlertMessage)).atIndex(0))
				.toExist()
				.withTimeout(10000);
			await element(by[textMatcher]('Delete').and(by.type(alertButtonType))).tap();
			await waitFor(element(by[textMatcher](deleteMessage)).atIndex(0))
				.not.toExist()
				.withTimeout(2000);
			await tapBack();
		});

		it('should reply in DM to another user', async () => {
			const replyUser = await createRandomUser();
			const { name: replyRoom } = await createRandomRoom(replyUser, 'c');
			const originalMessage = 'Message to reply in DM';
			const replyMessage = 'replied in dm';
			await sendMessage(replyUser, replyRoom, originalMessage);
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(2000);
			await navigateToRoom(replyRoom);
			await waitFor(element(by[textMatcher](originalMessage)).atIndex(0))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('room-view-join-button')).tap();
			await waitFor(element(by.id('room-view-join-button')))
				.not.toBeVisible()
				.withTimeout(10000);
			await element(by[textMatcher](originalMessage)).atIndex(0).longPress();
			await sleep(600); // wait for animation
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await sleep(600); // wait for animation
			// Fix android flaky test. Close the action sheet, then re-open again
			await element(by.id('action-sheet-handle')).swipe('down', 'fast', 0.5);
			await sleep(1000); // wait for animation
			await element(by[textMatcher](originalMessage)).atIndex(0).longPress();
			await sleep(600); // wait for animation
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await sleep(600); // wait for animation
			await waitFor(element(by[textMatcher]('Reply in direct message')).atIndex(0))
				.toBeVisible()
				.withTimeout(6000);
			await sleep(600); // wait for animation
			await element(by[textMatcher]('Reply in direct message')).atIndex(0).tap();
			await sleep(600); // wait for animation
			await waitFor(element(by.id(`room-view-title-${replyUser.username}`)))
				.toExist()
				.withTimeout(6000);
			await element(by.id('message-composer-input')).replaceText(replyMessage);
			await waitFor(element(by.id('message-composer-send')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('message-composer-send')).tap();
			await waitFor(element(by[textMatcher](replyMessage)))
				.toExist()
				.withTimeout(60000);
			await element(by[textMatcher](replyMessage)).atIndex(0).tap();
			await tapBack();
		});

		it('should save draft, check it, send it and clear it', async () => {
			await navigateToRoom(room);
			const draftMessage = 'draft';
			await element(by.id('message-composer-input')).typeText(draftMessage);
			await tapBack();
			await navigateToRecentRoom(room);
			await sleep(500); // wait for animation
			await expect(element(by.id('message-composer-input'))).toHaveText(draftMessage);
			await waitFor(element(by.id('message-composer-send')))
				.toExist()
				.withTimeout(5000);
			await element(by.id('message-composer-send')).tap();
			await checkMessage(draftMessage);
			await tapBack();
			await navigateToRecentRoom(room);
			await sleep(500); // wait for animation
			await expect(element(by.id('message-composer-input'))).toHaveText('');
			await tapBack();
		});

		it('should save message and quote draft correctly', async () => {
			const newUser = await createRandomUser();
			const { name: draftRoom } = await createRandomRoom(newUser, 'c');
			const draftMessage = 'draft';
			const originalMessage = '123';
			const quoteMessage = '123456';
			await sendMessage(newUser, draftRoom, originalMessage);
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(5000);
			await navigateToRoom(draftRoom);
			await waitFor(element(by[textMatcher](originalMessage)).atIndex(0))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('room-view-join-button')).tap();
			await waitFor(element(by.id('room-view-join-button')))
				.not.toBeVisible()
				.withTimeout(10000);
			// add draft
			await element(by.id('message-composer-input')).typeText(draftMessage);
			await tapBack();
			await navigateToRecentRoom(draftRoom);
			await sleep(500); // wait for animation
			await expect(element(by.id('message-composer-input'))).toHaveText(draftMessage);
			// add quote to draft
			await tryTapping(element(by[textMatcher](originalMessage)).atIndex(0), 2000, true);
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(5000);
			await expect(element(by.id('action-sheet-handle'))).toBeVisible();
			await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
			await element(by[textMatcher]('Quote')).atIndex(0).tap();
			await waitFor(element(by.id(`markdown-preview-${originalMessage}`)))
				.toBeVisible()
				.withTimeout(10000);
			await tapBack();
			await navigateToRecentRoom(draftRoom);
			await sleep(500); // wait for animation
			await waitFor(element(by.id(`markdown-preview-${originalMessage}`)))
				.toBeVisible()
				.withTimeout(10000);
			// edit draft with quote
			await element(by.id('message-composer-input')).replaceText(quoteMessage);
			await tapBack();
			await navigateToRecentRoom(draftRoom);
			await sleep(500); // wait for animation
			await expect(element(by.id('message-composer-input'))).toHaveText(quoteMessage);
			// send message
			await waitFor(element(by.id('message-composer-send')))
				.toExist()
				.withTimeout(5000);
			await element(by.id('message-composer-send')).tap();
			await waitFor(element(by.id(`reply-${newUser.name}-${originalMessage}`).withDescendant(by[textMatcher](originalMessage))))
				.toBeVisible()
				.withTimeout(5000);
			await expect(element(by.id('message-composer-input'))).toHaveText('');
		});

		it('should edit message on shareview and after close the text needs to be changed on roomView', async () => {
			const draftShareMessage = 'draftShare';
			const originalMessage = '123';
			await element(by.id('message-composer-input')).typeText(draftShareMessage);
			await element(by.id('message-composer-actions')).tap();
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await element(by[textMatcher]('Choose from library')).atIndex(0).tap();
			await sleep(300); // wait for animation
			await waitFor(element(by.id('message-composer-input-share')))
				.toHaveText(draftShareMessage)
				.withTimeout(2000);
			await element(by.id('message-composer-input-share')).replaceText(draftShareMessage + originalMessage);
			await element(by.id('share-view-close')).tap();
			await sleep(500); // wait for animation
			await waitFor(element(by.id('message-composer-input')))
				.toHaveText(draftShareMessage + originalMessage)
				.withTimeout(2000);
			// add quote to draft
			await tryTapping(element(by[textMatcher](originalMessage)).atIndex(0), 2000, true);
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await expect(element(by.id('action-sheet-handle'))).toBeVisible();
			await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
			await element(by[textMatcher]('Quote')).atIndex(0).tap();
			await element(by.id('message-composer-actions')).tap();
			await waitFor(element(by.id('action-sheet')))
				.toExist()
				.withTimeout(2000);
			await element(by[textMatcher]('Choose from library')).atIndex(0).tap();
			await sleep(500); // wait for animation
			await waitFor(element(by.id(`markdown-preview-${originalMessage}`)).atIndex(0))
				.toExist()
				.withTimeout(20000);
		});
	});
});
