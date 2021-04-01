const {
	device, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { sleep, navigateToLogin, login, tapBack, logout } = require('../../helpers/app');

const room = `private${ data.random }`;

describe('Share link', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
	});

	it('should create channel', async() => {
		await element(by.id('rooms-list-view-create-channel')).tap();
		await waitFor(element(by.id('new-message-view'))).toBeVisible().withTimeout(2000);
		await element(by.id('new-message-view-create-channel')).tap();
		await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
		await element(by.id('selected-users-view-submit')).tap();
		await element(by.id('create-channel-name')).replaceText(room);
		await element(by.id('create-channel-submit')).tap();
		await waitFor(element(by.id('room-view'))).toExist().withTimeout(60000);
		await expect(element(by.id('room-view'))).toExist();
		await waitFor(element(by.id(`room-view-title-${ room }`))).toExist().withTimeout(60000);
		await expect(element(by.id(`room-view-title-${ room }`))).toExist();
	})

	it('should navigate to invite user view', async() => {
		await element(by.id(`room-view-title-${ room }`)).tap();
		await waitFor(element(by.id('room-actions-view'))).toExist().withTimeout(60000);
		await expect(element(by.id('room-actions-view'))).toExist();
		await waitFor(element(by.id('room-actions-invite-user'))).toExist().withTimeout(60000);
		await element(by.id('room-actions-invite-user')).tap();
		await waitFor(element(by.id('invite-link-text'))).toExist().withTimeout(60000);
		
	})

	it('should edit invite', async() => {
		await waitFor(element(by.id('edit-invite-button'))).toExist().withTimeout(60000);
		await element(by.id('edit-invite-button')).tap();
		// await waitFor(element(by.text('1'))).toBeVisible().withTimeout(60000);
		// await element(by.text('1')).tap(); NOTE: It's still get error!
		await waitFor(element(by.id('generate-new-link-button'))).toBeVisible().withTimeout(60000);
		await element(by.id('generate-new-link-button')).tap();
	})

	it('should copy link', async() => {
		await element(by.id('share-link-button')).tap();
		await waitFor(element(by.text('Copy'))).toExist().withTimeout(60000);
		await element(by.text('Copy')).tap();
		await tapBack();
		await tapBack();
		await tapBack();
	})

	it('should send chat to existing user', async() => {
		await element(by.id('rooms-list-view-create-channel')).tap();
		await waitFor(element(by.id('new-message-view'))).toBeVisible().withTimeout(2000);
		await element(by.id('new-message-view-create-direct-message')).tap();
		await waitFor(element(by.id('select-users-view'))).toExist().withTimeout(60000);
		await expect(element(by.id('select-users-view'))).toExist();
		await element(by.id('select-users-view-search')).replaceText(data.users.existing.username);
		await waitFor(element(by.id(`select-users-view-item-${ data.users.existing.username }`))).toBeVisible().withTimeout(60000);
		await element(by.id(`select-users-view-item-${ data.users.existing.username }`)).tap();
		await element(by.id('selected-users-view-submit')).tap();
		await waitFor(element(by.id(`room-view-title-${ data.users.existing.username }`))).toExist().withTimeout(60000);
		await expect(element(by.id(`room-view-title-${ data.users.existing.username }`))).toExist();
		await element(by.id('messagebox-input')).tap();
		await element(by.id('messagebox-input')).longPress();
		await element(by.text('Paste')).tap();
		await element(by.id('messagebox-send-message')).atIndex(0).tap();
	})

	it('should change user', async() => {
		await tapBack();
		await logout();
		await navigateToLogin();
		await login(data.users.existing.username, data.users.existing.password);
		await waitFor(element(by.id(`rooms-list-view-item-${ data.users.regular.username }`))).toBeVisible().withTimeout(60000);
		await element(by.id(`rooms-list-view-item-${ data.users.regular.username }`)).tap();
	})

});
