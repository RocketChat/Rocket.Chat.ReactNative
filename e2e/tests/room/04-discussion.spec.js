const {
	expect, element, by, waitFor
} = require('detox');
const { navigateToLogin, login, mockMessage, tapBack, searchRoom } = require('../../helpers/app');
const data = require('../../data');

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

		it('should have edit button', async() => {
			await expect(element(by.id('room-info-view-edit-button'))).toBeVisible();
		});
	});
});
