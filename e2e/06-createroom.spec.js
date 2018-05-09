const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { navigateToLogin, login } = require('./helpers/app');
const data = require('./data');

async function navigateToCreateChannel() {
	await element(by.id('select-users-view-search')).tap();
	await element(by.id('select-users-view-search')).replaceText('rocket.cat');
	await waitFor(element(by.id('select-users-view-item-rocket.cat'))).toBeVisible().withTimeout(10000);
	await element(by.id('select-users-view-item-rocket.cat')).tap();
	await waitFor(element(by.id('selected-user-rocket.cat'))).toBeVisible().withTimeout(2000);
	await element(by.id('selected-users-view-submit')).tap();
	await waitFor(element(by.id('create-channel-view'))).toBeVisible().withTimeout(2000);
}

describe('Create room screen', () => {
	before(async() => {
		// await device.launchApp({ delete: true, permissions: { notifications: 'YES' } });
		// await addServer();
		
		await navigateToLogin();
        await login();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
		await element(by.id('rooms-list-view-create-channel')).tap();
		await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
	});

	describe('Render', async() => {
		it('should have select users screen', async() => {
			await expect(element(by.id('select-users-view'))).toBeVisible();
		});

		it('should have search input', async() => {
			await expect(element(by.id('select-users-view-search'))).toBeVisible();
		});

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', async() => {
		beforeEach(async() => {
			await device.reloadReactNative();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('rooms-list-view-create-channel')).tap();
			await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
		});

		it('should back to rooms list', async() => {
			await element(by.id('header-back')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});

		it('should search users', async() => {
			await element(by.id('select-users-view-search')).tap();
			await element(by.id('select-users-view-search')).replaceText('rocket.cat');
			await waitFor(element(by.id(`select-users-view-item-rocket.cat`))).toBeVisible().withTimeout(10000);
			await expect(element(by.id(`select-users-view-item-rocket.cat`))).toBeVisible();
		});

		it('should select/unselect user', async() => {
			await element(by.id('select-users-view-search')).tap();
			await element(by.id('select-users-view-search')).replaceText('rocket.cat');
			await waitFor(element(by.id('select-users-view-item-rocket.cat'))).toBeVisible().withTimeout(10000);
			await element(by.id('select-users-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('selected-user-rocket.cat'))).toBeVisible();
			await expect(element(by.id('selected-users-view-submit'))).toBeVisible();
			await element(by.id('selected-user-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeNotVisible().withTimeout(2000);
			await expect(element(by.id('selected-user-rocket.cat'))).toBeNotVisible();
			await expect(element(by.id('selected-users-view-submit'))).toBeNotVisible();
		});

		it('should navigate to create channel view', async() => {
			await navigateToCreateChannel();
			await expect(element(by.id('create-channel-view'))).toBeVisible();
			await expect(element(by.id('create-channel-name'))).toBeVisible();
			await expect(element(by.id('create-channel-type'))).toBeVisible();
			await expect(element(by.id('create-channel-submit'))).toBeVisible();
		});

		it('should get invalid room', async() => {
			await navigateToCreateChannel();
			await element(by.id('create-channel-name')).tap();
			await element(by.id('create-channel-name')).typeText('general');
			await element(by.id('create-channel-submit')).tap();
			await waitFor(element(by.id('create-channel-error'))).toBeVisible().withTimeout(5000);
			await expect(element(by.id('create-channel-error'))).toBeVisible();
		});

		it('should create public room', async() => {
			await navigateToCreateChannel();
			await element(by.id('create-channel-name')).tap();
			await element(by.id('create-channel-name')).typeText(`public${ data.random }`);
			await element(by.id('create-channel-submit')).tap();
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(10000);
			await expect(element(by.id('room-view'))).toBeVisible();
			await expect(element(by.id('room-view-title'))).toHaveText(`public${ data.random }`);
		});

		it('should create private room', async() => {
			await navigateToCreateChannel();
			await element(by.id('create-channel-name')).tap();
			await element(by.id('create-channel-name')).typeText(`private${ data.random }`);
			await element(by.id('create-channel-type')).tap();
			await element(by.id('create-channel-submit')).tap();
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(10000);
			await expect(element(by.id('room-view'))).toBeVisible();
			await expect(element(by.id('room-view-title'))).toHaveText(`private${ data.random }`);
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});
});
