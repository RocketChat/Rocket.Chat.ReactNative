const {
	expect, element, by, waitFor
} = require('detox');
const { navigateToLogin, login, mockMessage, tapBack, searchRoom, sleep } = require('../../helpers/app');
const data = require('../../data');
const { sendMessageDiscussion } = require('../../helpers/data_setup')

const channel = data.groups.private.name;

const navigateToRoom = async() => {
	await searchRoom(channel);
	await element(by.id(`rooms-list-view-item-${ channel }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
}

describe('Discussion', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password)
	});

	it('should create discussion from NewMessageView', async() => {
		const discussionName = `${data.random} Discussion NewMessageView`;
		await element(by.id('rooms-list-view-create-channel')).tap();
		await waitFor(element(by.id('new-message-view'))).toExist().withTimeout(2000);
		await element(by.label('Create Discussion')).tap();
		await waitFor(element(by.id('create-discussion-view'))).toExist().withTimeout(60000);
		await expect(element(by.id('create-discussion-view'))).toExist();
		await element(by.label('Select a Channel...')).tap();
		await element(by.id('multi-select-search')).replaceText(`${channel}`);
		await waitFor(element(by.id(`multi-select-item-${channel}`))).toExist().withTimeout(10000);
		await element(by.id(`multi-select-item-${channel}`)).tap();
		await element(by.id('multi-select-discussion-name')).replaceText(discussionName);
		await waitFor(element(by.id(`create-discussion-submit`))).toExist().withTimeout(10000);
		await element(by.id('create-discussion-submit')).tap();
		await waitFor(element(by.id('room-view'))).toExist().withTimeout(10000);
		await waitFor(element(by.id(`room-view-title-${ discussionName }`))).toExist().withTimeout(5000);
		await tapBack();
		await waitFor(element(by.id(`rooms-list-view-item-${ discussionName }`))).toExist().withTimeout(5000);
	});

	it('should create discussion from action button', async() => {
		const discussionName = `${data.random} Discussion Action Button`;
		await navigateToRoom();
		await element(by.id('messagebox-actions')).tap();
		await waitFor(element(by.id('action-sheet'))).toExist().withTimeout(2000);
		await element(by.label('Create Discussion')).tap();
		await waitFor(element(by.id('create-discussion-view'))).toExist().withTimeout(2000);
		await element(by.id('multi-select-discussion-name')).replaceText(discussionName);
		await waitFor(element(by.id(`create-discussion-submit`))).toExist().withTimeout(10000);
		await element(by.id('create-discussion-submit')).tap();
		await waitFor(element(by.id('room-view'))).toExist().withTimeout(10000);
		await waitFor(element(by.id(`room-view-title-${ discussionName }`))).toExist().withTimeout(5000);
	});

	describe('Create Discussion from action sheet', async() => {
		it('should send a message', async() => {
			await waitFor(element(by.id('messagebox'))).toBeVisible().withTimeout(60000);
			await mockMessage('message');
		});

		it('should create discussion', async() => {
			const discussionName = `${ data.random }message`;
			await element(by.label(discussionName)).atIndex(0).longPress();
			await waitFor(element(by.id('action-sheet'))).toExist().withTimeout(2000);
			await element(by.label(`Start a Discussion`)).atIndex(0).tap();
			await waitFor(element(by.id('create-discussion-view'))).toExist().withTimeout(2000);
			await element(by.id('create-discussion-submit')).tap();
			await waitFor(element(by.id('room-view'))).toExist().withTimeout(10000);
			await waitFor(element(by.id(`room-view-title-${ discussionName }`))).toExist().withTimeout(5000);
		});
	});
	
	describe('Check RoomActionsView render', async() => {
		it('should navigete to RoomActionsView', async() => {
			await waitFor(element(by.id('room-header'))).toBeVisible().withTimeout(5000);
			await element(by.id('room-header')).tap();
			await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(5000);
		});

		it('should have room actions screen', async() => {
			await expect(element(by.id('room-actions-view'))).toBeVisible();
		});

		it('should have info', async() => {
			await expect(element(by.id('room-actions-info'))).toBeVisible();
		});

		it('should have members', async() => {
			await expect(element(by.id('room-actions-members'))).toBeVisible();
		});

		it('should have files', async() => {
			await expect(element(by.id('room-actions-files'))).toBeVisible();
		});

		it('should have mentions', async() => {
			await expect(element(by.id('room-actions-mentioned'))).toBeVisible();
		});

		it('should have starred', async() => {
			await expect(element(by.id('room-actions-starred'))).toBeVisible();
		});

		it('should have search', async() => {
			await expect(element(by.id('room-actions-search'))).toBeVisible();
		});

		it('should have share', async() => {
			await element(by.type('UIScrollView')).atIndex(1).swipe('up');
			await expect(element(by.id('room-actions-share'))).toBeVisible();
		});

		it('should have pinned', async() => {
			await expect(element(by.id('room-actions-pinned'))).toBeVisible();
		});

		it('should not have notifications', async() => {
			await expect(element(by.id('room-actions-notifications'))).toBeVisible();
		});

		it('should not have leave channel', async() => {
			await expect(element(by.id('room-actions-leave-channel'))).toBeVisible();
		});

		it('should navigate to RoomActionView', async() => {
			await element(by.type('UIScrollView')).atIndex(1).swipe('down');
			await expect(element(by.id('room-actions-info'))).toBeVisible();
			await element(by.id('room-actions-info')).tap();
			await waitFor(element(by.id('room-info-view'))).toExist().withTimeout(60000);
			await expect(element(by.id('room-info-view'))).toExist();
		});

		it('should not have edit button', async() => {
			await expect(element(by.id('room-info-view-edit-button'))).toBeNotVisible();
		});
	});

	describe('should enter in discussion room by tap the discussionButton in RoomView', async () => {
		it(' and when back the discussionButton has to be updated', async () => {
			// need to back to RoomListView
			await tapBack();
			await tapBack();
			await tapBack();
			await element(by.id(`rooms-list-view-item-${channel}`)).tap();
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
			await element(by.label('1 message')).atIndex(0).tap();
			await element(by.label('No messages yet')).atIndex(1).tap();
			await element(by.id('messagebox-input')).atIndex(2).tap();
			await element(by.id('messagebox-input')).atIndex(2).typeText(`${data.random}discussion`);
			await element(by.id('messagebox-send-message')).tap();
			// back to previous room with Discussion Button
			await tapBack();
			await waitFor(element(by.label('1 message')).atIndex(1)).toExist().withTimeout(2000);
		})

		it('receive a message while still into the discussion', async () => {
			const userAlternate = data.users.alternate;
			const discussionName = `${data.random}Discussion`;
			const message = `${data.random}message`;
			// need to back to RoomListView
			await tapBack();
			await tapBack();
			await element(by.label('general')).tap();

			// Create a discussion in general channel
			await element(by.id('messagebox-actions')).tap();
			await waitFor(element(by.id('action-sheet'))).toExist().withTimeout(2000);
			await element(by.label('Create Discussion')).tap();
			await waitFor(element(by.id('create-discussion-view'))).toExist().withTimeout(2000);
			await element(by.id('multi-select-discussion-name')).replaceText(discussionName);
			await waitFor(element(by.id(`create-discussion-submit`))).toExist().withTimeout(10000);
			await element(by.id('create-discussion-submit')).tap();

			// back to Room List View and join in general channel again to join in new discussion
			await tapBack();
			await element(by.label('general')).tap();
			await waitFor(element(by.id(`discussion-button-${discussionName}`))).toBeVisible().withTimeout(5000);
			await element(by.id(`discussion-button-${discussionName}`)).tap();

			// // Add user.alternate to discussion - actually don't need to receive the message
			// await element(by.id('room-header')).atIndex(1).tap();
			// await element(by.id('room-actions-add-user')).tap();
			// await waitFor(element(by.id('select-users-view-search'))).toExist().withTimeout(4000);
			// await element(by.id('select-users-view-search')).tap();
			// await element(by.id('select-users-view-search')).replaceText(userAlternate.username);
			// // Searching the users
			// await waitFor(element(by.id(`select-users-view-item-${userAlternate.username}`))).toExist().withTimeout(10000);
			// await element(by.id(`select-users-view-item-${userAlternate.username}`)).tap();
			// await waitFor(element(by.id(`selected-user-${userAlternate.username}`))).toExist().withTimeout(5000);
			// await element(by.id('selected-users-view-submit')).tap();
			// await waitFor(element(by.id('room-actions-members'))).toExist().withTimeout(10000);
			// await tapBack()

			// User.alternate -> login, getDiscussions from GENERAL channel and search the ID from last discussion
			await sendMessageDiscussion(userAlternate, 'GENERAL', message, data.users.regular.username);

			// Check if the message list is update
			await sleep(300);
			await waitFor(element(by.label(message))).toExist().withTimeout(5000);
		});
	})

});
