const {
	device, expect, element, by, waitFor
} = require('detox');
const OTP = require('otp.js');
const GA = OTP.googleAuthenticator;
const { navigateToLogin, login, tapBack, sleep, searchRoom } = require('../../helpers/app');
const data = require('../../data');

describe('Broadcast room', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login();
	});

	it('should create broadcast room', async() => {
		await element(by.id('rooms-list-view-create-channel')).tap();
		await waitFor(element(by.id('new-message-view'))).toBeVisible().withTimeout(2000);
		await element(by.id('new-message-view-create-channel')).tap();
		await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
		await element(by.id('select-users-view-search')).replaceText(data.alternateUser);
		await waitFor(element(by.id(`select-users-view-item-${ data.alternateUser }`))).toBeVisible().withTimeout(60000);
		await expect(element(by.id(`select-users-view-item-${ data.alternateUser }`))).toBeVisible();
		await element(by.id(`select-users-view-item-${ data.alternateUser }`)).tap();
		await waitFor(element(by.id(`selected-user-${ data.alternateUser }`))).toBeVisible().withTimeout(5000);
		await sleep(1000);
		await element(by.id('selected-users-view-submit')).tap();
		await sleep(1000);
		await waitFor(element(by.id('create-channel-view'))).toExist().withTimeout(5000);
		await element(by.id('create-channel-name')).replaceText(`broadcast${ data.random }`);
		await sleep(1000);
		await element(by.id('create-channel-broadcast')).tap();
		await sleep(1000);
		await element(by.id('create-channel-submit')).tap();
		await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(60000);
		await expect(element(by.id('room-view'))).toBeVisible();
		await waitFor(element(by.id(`room-view-title-broadcast${ data.random }`))).toBeVisible().withTimeout(60000);
		await expect(element(by.id(`room-view-title-broadcast${ data.random }`))).toBeVisible();
		await sleep(1000);
		await element(by.id('room-view-header-actions')).tap();
		await sleep(1000);
		await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(5000);
		await element(by.id('room-actions-info')).tap();
		await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
		await expect(element(by.label('Broadcast Channel').withAncestor(by.id('room-info-view-broadcast')))).toBeVisible();
		await tapBack();
		await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(2000);
		await tapBack();
		await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(2000);
	});

	it('should send message', async() => {
		await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
		await element(by.id('messagebox-input')).tap();
		await element(by.id('messagebox-input')).typeText(`${ data.random }message`);
		await element(by.id('messagebox-send-message')).tap();
		await waitFor(element(by.label(`${ data.random }message`)).atIndex(0)).toExist().withTimeout(60000);
		await expect(element(by.label(`${ data.random }message`)).atIndex(0)).toBeVisible();
		await tapBack();
	});

	it('should login as user without write message authorization and enter room', async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await element(by.id('login-view-email')).replaceText(data.alternateUser);
		await element(by.id('login-view-password')).replaceText(data.alternateUserPassword);
		await sleep(1000);
		await element(by.id('login-view-submit')).tap();
		await waitFor(element(by.id('two-factor'))).toBeVisible().withTimeout(5000);
		await expect(element(by.id('two-factor'))).toBeVisible();
		const code = GA.gen(data.alternateUserTOTPSecret);
		await element(by.id('two-factor-input')).replaceText(code);
		await sleep(1000);
		await element(by.id('two-factor-send')).tap();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
		await searchRoom(`broadcast${ data.random }`);
		await waitFor(element(by.id(`rooms-list-view-item-broadcast${ data.random }`))).toExist().withTimeout(60000);
		await expect(element(by.id(`rooms-list-view-item-broadcast${ data.random }`))).toExist();
		await element(by.id(`rooms-list-view-item-broadcast${ data.random }`)).tap();
		await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
		await waitFor(element(by.id(`room-view-title-broadcast${ data.random }`))).toBeVisible().withTimeout(60000);
		await expect(element(by.id(`room-view-title-broadcast${ data.random }`))).toBeVisible();
		await sleep(1000);
	});

	it('should not have messagebox', async() => {
		await expect(element(by.id('messagebox'))).toBeNotVisible();
	});

	it('should be read only', async() => {
		await expect(element(by.label('This room is read only'))).toExist();
	});

	it('should have the message created earlier', async() => {
		await waitFor(element(by.label(`${ data.random }message`)).atIndex(0)).toBeVisible().withTimeout(60000);
		await expect(element(by.label(`${ data.random }message`)).atIndex(0)).toBeVisible();
	});

	it('should have reply button', async() => {
		await expect(element(by.id('message-broadcast-reply'))).toBeVisible();
	});

	it('should tap on reply button and navigate to direct room', async() => {
		await element(by.id('message-broadcast-reply')).tap();
		await sleep(1000);
		await waitFor(element(by.id(`room-view-title-${ data.user }`))).toBeVisible().withTimeout(5000);
		await expect(element(by.id(`room-view-title-${ data.user }`))).toBeVisible();
	});

	it('should reply broadcasted message', async() => {
		await element(by.id('messagebox-input')).tap();
		await element(by.id('messagebox-input')).typeText(`${ data.random }broadcastreply`);
		await element(by.id('messagebox-send-message')).tap();
		await waitFor(element(by.label(`${ data.random }broadcastreply`)).atIndex(0)).toBeVisible().withTimeout(60000);
		await expect(element(by.label(`${ data.random }broadcastreply`)).atIndex(0)).toBeVisible();
	});
});
