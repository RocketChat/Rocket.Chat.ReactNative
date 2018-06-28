const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const data = require('./data');
const { tapBack } = require('./helpers/app');

describe('Create room screen', () => {
	before(async() => {
		await device.reloadReactNative(); // TODO: remove this after fix logout subscription
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
		it('should back to rooms list', async() => {
			await tapBack('Messages');
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
			await element(by.id('rooms-list-view-create-channel')).tap();
			await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
		});

		it('should search users', async() => {
			await element(by.id('select-users-view-search')).replaceText('rocket.cat');
			await waitFor(element(by.id(`select-users-view-item-rocket.cat`))).toBeVisible().withTimeout(10000);
			await expect(element(by.id(`select-users-view-item-rocket.cat`))).toBeVisible();
		});

		it('should select/unselect user', async() => {
			await element(by.id('select-users-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeVisible().withTimeout(5000);
			await expect(element(by.id('selected-user-rocket.cat'))).toBeVisible();
			await expect(element(by.id('selected-users-view-submit'))).toBeVisible();
			await element(by.id('selected-user-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeNotVisible().withTimeout(5000);
			await expect(element(by.id('selected-user-rocket.cat'))).toBeNotVisible();
			await expect(element(by.id('selected-users-view-submit'))).toBeNotVisible();
			await element(by.id('select-users-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeVisible().withTimeout(5000);
		});

		it('should navigate to create channel view', async() => {
			await element(by.id('selected-users-view-submit')).tap();
			await waitFor(element(by.id('create-channel-view'))).toBeVisible().withTimeout(5000);
			await expect(element(by.id('create-channel-view'))).toBeVisible();
			await expect(element(by.id('create-channel-name'))).toBeVisible();
			await expect(element(by.id('create-channel-type'))).toBeVisible();
			await expect(element(by.id('create-channel-readonly'))).toBeVisible();
			await expect(element(by.id('create-channel-broadcast'))).toExist();
			await expect(element(by.id('create-channel-submit'))).toExist();
		});

		it('should get invalid room', async() => {
			await element(by.id('create-channel-name')).replaceText('general');
			await element(by.id('create-channel-submit')).tap();
			await waitFor(element(by.id('create-channel-error'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('create-channel-error'))).toBeVisible();
		});

		it('should create public room', async() => {
			await element(by.id('create-channel-name')).replaceText(`public${ data.random }`);
			await element(by.id('create-channel-type')).tap();
			await element(by.id('create-channel-submit')).tap();
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('room-view'))).toBeVisible();
			await waitFor(element(by.text(`public${ data.random }`))).toBeVisible().withTimeout(60000);
			await expect(element(by.text(`public${ data.random }`))).toBeVisible();
			await tapBack('Messages');
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await waitFor(element(by.id(`rooms-list-view-item-public${ data.random }`))).toBeVisible().withTimeout(60000);
			await expect(element(by.id(`rooms-list-view-item-public${ data.random }`))).toBeVisible();
		});

		it('should create private room', async() => {
			await element(by.id('rooms-list-view-create-channel')).tap();
			await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('select-users-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeVisible().withTimeout(5000);
			await element(by.id('selected-users-view-submit')).tap();
			await waitFor(element(by.id('create-channel-view'))).toBeVisible().withTimeout(5000);
			await element(by.id('create-channel-name')).replaceText(`private${ data.random }`);
			await element(by.id('create-channel-submit')).tap();
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('room-view'))).toBeVisible();
			await waitFor(element(by.text(`private${ data.random }`))).toBeVisible().withTimeout(60000);
			await expect(element(by.text(`private${ data.random }`))).toBeVisible();
			await tapBack('Messages');
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			await waitFor(element(by.id(`rooms-list-view-item-private${ data.random }`))).toBeVisible().withTimeout(60000);
			await expect(element(by.id(`rooms-list-view-item-private${ data.random }`))).toBeVisible();
		});

		afterEach(async() => {
			takeScreenshot();
		});
	});
});
