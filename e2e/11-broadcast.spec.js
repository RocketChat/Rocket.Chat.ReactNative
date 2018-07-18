const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { logout, navigateToLogin, login, tapBack } = require('./helpers/app');
const data = require('./data');

describe('Broadcast room', () => {
	before(async() => {
		await device.reloadReactNative();
	});

	it('should create broadcast room', async() => {
		await element(by.id('rooms-list-view-create-channel')).tap();
		await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
		await element(by.id(`select-users-view-item-${ data.alternateUser }`)).tap();
		await waitFor(element(by.id(`selected-user-${ data.alternateUser }`))).toBeVisible().withTimeout(5000);
		await element(by.id('selected-users-view-submit')).tap();
		await waitFor(element(by.id('create-channel-view'))).toBeVisible().withTimeout(5000);
		await element(by.id('create-channel-name')).replaceText(`broadcast${ data.random }`);
		await element(by.id('create-channel-broadcast')).tap();
		await element(by.id('create-channel-submit')).tap();
		await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(60000);
		await expect(element(by.id('room-view'))).toBeVisible();
		await waitFor(element(by.text(`broadcast${ data.random }`))).toBeVisible().withTimeout(60000);
		await expect(element(by.text(`broadcast${ data.random }`))).toBeVisible();
		await element(by.id('room-view-header-actions')).tap();
		await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(5000);
		await element(by.id('room-actions-info')).tap();
		await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id('room-info-view-broadcast'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('room-info-view-broadcast'))).toBeVisible();
		await tapBack('Actions');
		await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
		await tapBack(`broadcast${ data.random }`);
		await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(2000);
		await tapBack('Messages');
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
		await waitFor(element(by.id(`rooms-list-view-item-broadcast${ data.random }`))).toBeVisible().withTimeout(60000);
		await expect(element(by.id(`rooms-list-view-item-broadcast${ data.random }`))).toBeVisible();
	});

	it('should send message', async() => {
		await element(by.id(`rooms-list-view-item-broadcast${ data.random }`)).tap();
		await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
		await element(by.id('messagebox-input')).tap();
		await element(by.id('messagebox-input')).typeText(`${ data.random }message`);
		await element(by.id('messagebox-send-message')).tap();
		await waitFor(element(by.text(`${ data.random }message`))).toBeVisible().withTimeout(60000);
		await expect(element(by.text(`${ data.random }message`))).toBeVisible();
	});

	it('should login as user without write message authorization and enter room', async() => {
		await tapBack('Messages');
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('rooms-list-view'))).toBeVisible();
		await logout();
		await navigateToLogin();
		await element(by.id('login-view-email')).replaceText(data.alternateUser);
		await element(by.id('login-view-password')).replaceText(data.alternateUserPassword);
		await element(by.id('login-view-submit')).tap();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
		await device.reloadReactNative(); // remove after fix logout
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);		
		await waitFor(element(by.id(`rooms-list-view-item-broadcast${ data.random }`))).toBeVisible().withTimeout(60000);
		await expect(element(by.id(`rooms-list-view-item-broadcast${ data.random }`))).toBeVisible();
		await element(by.id(`rooms-list-view-item-broadcast${ data.random }`)).tap();
		await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
		await waitFor(element(by.text(`broadcast${ data.random }`))).toBeVisible().withTimeout(60000);
		await expect(element(by.text(`broadcast${ data.random }`))).toBeVisible();
	});

	it('should not have messagebox', async() => {
		await expect(element(by.id('messagebox'))).toBeNotVisible();
	});

	it('should be read only', async() => {
		await expect(element(by.text('This room is read only'))).toBeVisible();
	});

	it('should have the message created earlier', async() => {
		await waitFor(element(by.text(`${ data.random }message`))).toBeVisible().withTimeout(60000);
		await expect(element(by.text(`${ data.random }message`))).toBeVisible();
	});

	it('should have reply button', async() => {
		await expect(element(by.text('Reply'))).toBeVisible();
	});

	it('should tap on reply button and navigate to direct room', async() => {
		await element(by.text('Reply')).tap();
		await waitFor(element(by.text(data.user))).toBeVisible().withTimeout(60000);
		await expect(element(by.text(data.user))).toBeVisible();
	});

	it('should reply broadcasted message', async() => {
		await element(by.id('messagebox-input')).tap();
		await element(by.id('messagebox-input')).typeText(`${ data.random }broadcastreply`);
		await element(by.id('messagebox-send-message')).tap();
		// await waitFor(element(by.text(`${ data.random }message`))).toBeVisible().withTimeout(60000);
		// await expect(element(by.text(`${ data.random }message`))).toBeVisible();
	});

	afterEach(async() => {
		takeScreenshot();
	});

	after(async() => {
		// log back as main test user and left screen on RoomsListView
		await tapBack('Messages');
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
		await logout();
		await navigateToLogin();
		await login();
	})
});
