const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('./data');
const { tapBack, sleep } = require('./helpers/app');

describe('Create room screen', () => {
	before(async() => {
		await sleep(5000);
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
		await device.launchApp({ newInstance: true });
		await element(by.id('rooms-list-view-create-channel')).tap();
		await waitFor(element(by.id('new-message-view'))).toBeVisible().withTimeout(2000);
	});

	describe('New Message', async() => {
		describe('Render', async() => {
			it('should have new message screen', async() => {
				await expect(element(by.id('new-message-view'))).toBeVisible();
			});
	
			it('should have search input', async() => {
				await waitFor(element(by.id('new-message-view-search'))).toExist().withTimeout(2000);
				await expect(element(by.id('new-message-view-search'))).toExist();
			});
		})

		describe('Usage', async() => {
			it('should back to rooms list', async() => {
				await sleep(1000);
				await element(by.id('new-message-view-close')).tap();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('rooms-list-view'))).toBeVisible();
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('new-message-view'))).toBeVisible();
			});

			it('should search user and navigate', async() => {
				await element(by.id('new-message-view-search')).replaceText('rocket.cat');
				await waitFor(element(by.id('new-message-view-item-rocket.cat'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('new-message-view-item-rocket.cat'))).toBeVisible();
				await element(by.id('new-message-view-item-rocket.cat')).tap();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(10000);
				await expect(element(by.id('room-view'))).toBeVisible();
				await waitFor(element(by.id('room-view-title-rocket.cat'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('room-view-title-rocket.cat'))).toBeVisible();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
			});

			it('should navigate to select users', async() => {
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('new-message-view'))).toBeVisible();
				await sleep(1000);
				await element(by.id('new-message-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
				await expect(element(by.id('select-users-view'))).toBeVisible();
			});
		})
	});

	describe('Select Users', async() => {
		it('should search users', async() => {
			await element(by.id('select-users-view-search')).replaceText('rocket.cat');
			await waitFor(element(by.id(`select-users-view-item-rocket.cat`))).toBeVisible().withTimeout(10000);
			await expect(element(by.id(`select-users-view-item-rocket.cat`))).toBeVisible();
		});

		it('should select/unselect user', async() => {
			await element(by.id('select-users-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeVisible().withTimeout(5000);
			await expect(element(by.id('selected-user-rocket.cat'))).toBeVisible();
			await element(by.id('selected-user-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeNotVisible().withTimeout(5000);
			await expect(element(by.id('selected-user-rocket.cat'))).toBeNotVisible();
			await element(by.id('select-users-view-item-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeVisible().withTimeout(5000);
		});

		it('should navigate to create channel view', async() => {
			await element(by.id('selected-users-view-submit')).tap();
			await waitFor(element(by.id('create-channel-view'))).toExist().withTimeout(5000);
			await expect(element(by.id('create-channel-view'))).toExist();
		});
	})

	describe('Create Channel', async() => {
		describe('Render', async() => {
			it('should render all fields', async() => {
				await expect(element(by.id('create-channel-name'))).toBeVisible();
				await expect(element(by.id('create-channel-type'))).toBeVisible();
				await expect(element(by.id('create-channel-readonly'))).toBeVisible();
				await expect(element(by.id('create-channel-broadcast'))).toExist();
			})
		})

		describe('Usage', async() => {
			it('should get invalid room', async() => {
				await element(by.id('create-channel-name')).replaceText('general');
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.text(`A channel with name 'general' exists`))).toBeVisible().withTimeout(60000);
				await expect(element(by.text(`A channel with name 'general' exists`))).toBeVisible();
				await element(by.text('OK')).tap();
			});
	
			it('should create public room', async() => {
				const room = `public${ data.random }`;
				await element(by.id('create-channel-name')).replaceText(room);
				await element(by.id('create-channel-type')).tap();
				await sleep(1000);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('room-view'))).toBeVisible();
				await waitFor(element(by.id(`room-view-title-${ room }`))).toBeVisible().withTimeout(60000);
				await expect(element(by.id(`room-view-title-${ room }`))).toBeVisible();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toBeVisible().withTimeout(60000);
				await expect(element(by.id(`rooms-list-view-item-${ room }`))).toBeVisible();
			});
	
			it('should create private room', async() => {
				const room = `private${ data.random }`;
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				// await device.launchApp({ newInstance: true });
				await sleep(1000);
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view'))).toBeVisible().withTimeout(2000);
				await sleep(1000);
				await element(by.id('new-message-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
				await sleep(1000);
				await element(by.id('select-users-view-item-rocket.cat')).tap();
				await waitFor(element(by.id('selected-user-rocket.cat'))).toBeVisible().withTimeout(5000);
				await element(by.id('selected-users-view-submit')).tap();
				await waitFor(element(by.id('create-channel-view'))).toExist().withTimeout(5000);
				await element(by.id('create-channel-name')).replaceText(room);
				await sleep(1000);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('room-view'))).toBeVisible();
				await waitFor(element(by.id(`room-view-title-${ room }`))).toBeVisible().withTimeout(60000);
				await expect(element(by.id(`room-view-title-${ room }`))).toBeVisible();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toBeVisible().withTimeout(60000);
				await expect(element(by.id(`rooms-list-view-item-${ room }`))).toBeVisible();
			});

			it('should create empty room', async() => {
				const room = `empty${ data.random }`;
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				// await device.launchApp({ newInstance: true });
				await sleep(1000);
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view'))).toBeVisible().withTimeout(2000);
				await sleep(1000);
				await element(by.id('new-message-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
				await sleep(1000);
				await element(by.id('selected-users-view-submit')).tap();
				await waitFor(element(by.id('create-channel-view'))).toExist().withTimeout(5000);
				await element(by.id('create-channel-name')).replaceText(room);
				await sleep(1000);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('room-view'))).toBeVisible();
				await waitFor(element(by.id(`room-view-title-${ room }`))).toBeVisible().withTimeout(60000);
				await expect(element(by.id(`room-view-title-${ room }`))).toBeVisible();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toBeVisible().withTimeout(60000);
				await expect(element(by.id(`rooms-list-view-item-${ room }`))).toBeVisible();
			});
		})
	});
});
