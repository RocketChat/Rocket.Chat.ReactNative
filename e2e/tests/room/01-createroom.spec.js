const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { tapBack, sleep, navigateToLogin, login, tryTapping } = require('../../helpers/app');



describe('Create room screen', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
	});

	describe('New Message', async() => {
		before(async() => {
			await element(by.id('rooms-list-view-create-channel')).tap();
		});

		describe('Render', async() => {
			it('should have new message screen', async() => {
				await waitFor(element(by.id('new-message-view'))).toBeVisible().withTimeout(2000);
			});
	
			it('should have search input', async() => {
				await waitFor(element(by.id('new-message-view-search'))).toBeVisible().withTimeout(2000);
			});
		})

		describe('Usage', async() => {
			it('should back to rooms list', async() => {
				await waitFor(element(by.id('new-message-view-close'))).toBeVisible().withTimeout(5000);
				await element(by.id('new-message-view-close')).tap();

				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(5000);
				
				await tryTapping(element(by.id('rooms-list-view-create-channel')), 3000);
				//await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view'))).toExist().withTimeout(5000);
			});

			it('should search user and navigate', async() => {
				await element(by.id('new-message-view-search')).replaceText('rocket.cat');
				await waitFor(element(by.id('new-message-view-item-rocket.cat'))).toExist().withTimeout(60000);
				await element(by.id('new-message-view-item-rocket.cat')).tap();
				await waitFor(element(by.id('room-view'))).toExist().withTimeout(10000);
				await waitFor(element(by.id('room-view-title-rocket.cat'))).toExist().withTimeout(60000);
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(5000);
			});

			it('should navigate to select users', async() => {
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view'))).toExist().withTimeout(5000);
				await element(by.id('new-message-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view'))).toExist().withTimeout(5000);
			});
		})
	});

	describe('Select Users', async() => {
		it('should search users', async() => {
			await element(by.id('select-users-view-search')).replaceText('rocket.cat');
			await waitFor(element(by.id(`select-users-view-item-rocket.cat`))).toBeVisible().withTimeout(10000);
		});

		it('should select/unselect user', async() => {
			// Spotlight issues
			await element(by.id('select-users-view-item-rocket.cat')).atIndex(0).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeVisible().withTimeout(10000);
			await element(by.id('selected-user-rocket.cat')).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeNotVisible().withTimeout(10000);
			// Spotlight issues
			await element(by.id('select-users-view-item-rocket.cat')).atIndex(0).tap();
			await waitFor(element(by.id('selected-user-rocket.cat'))).toBeVisible().withTimeout(10000);
		});

		it('should navigate to create channel view', async() => {
			await element(by.id('selected-users-view-submit')).tap();
			await waitFor(element(by.id('create-channel-view'))).toExist().withTimeout(10000);
		});
	})

	describe('Create Channel', async() => {
		describe('Render', async() => {
			it('should render all fields', async() => {
				await expect(element(by.id('create-channel-name'))).toBeVisible();
				await expect(element(by.id('create-channel-type'))).toBeVisible();
				await expect(element(by.id('create-channel-readonly'))).toBeVisible();
				await expect(element(by.id('create-channel-broadcast'))).toBeVisible();
			})
		})

		describe('Usage', async() => {
			it('should get invalid room', async() => {
				await element(by.id('create-channel-name')).replaceText('general');
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.text(`A channel with name 'general' exists`))).toExist().withTimeout(60000);
				await expect(element(by.text(`A channel with name 'general' exists`))).toExist();
				await element(by.text('OK')).tap();
			});
	
			it('should create public room', async() => {
				const room = `public${ data.random }`;
				await element(by.id('create-channel-name')).replaceText(room);
				await element(by.id('create-channel-type')).tap();
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view'))).toExist().withTimeout(60000);
				await expect(element(by.id('room-view'))).toExist();
				await waitFor(element(by.id(`room-view-title-${ room }`))).toExist().withTimeout(60000);
				await expect(element(by.id(`room-view-title-${ room }`))).toExist();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(10000);
				await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toExist().withTimeout(60000);
				await expect(element(by.id(`rooms-list-view-item-${ room }`))).toExist();
			});
	
			it('should create private room', async() => {
				const room = `private${ data.random }`;
				await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(5000);
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view'))).toExist().withTimeout(5000);
				await element(by.id('new-message-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view'))).toExist().withTimeout(5000);
				await element(by.id('select-users-view-item-rocket.cat')).tap();
				await waitFor(element(by.id('selected-user-rocket.cat'))).toExist().withTimeout(5000);
				await element(by.id('selected-users-view-submit')).tap();
				await waitFor(element(by.id('create-channel-view'))).toExist().withTimeout(5000);
				await element(by.id('create-channel-name')).replaceText(room);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view'))).toExist().withTimeout(60000);
				await expect(element(by.id('room-view'))).toExist();
				await waitFor(element(by.id(`room-view-title-${ room }`))).toExist().withTimeout(60000);
				await expect(element(by.id(`room-view-title-${ room }`))).toExist();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(5000);
				await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toExist().withTimeout(60000);
				await expect(element(by.id(`rooms-list-view-item-${ room }`))).toExist();
			});

			it('should create empty room', async() => {
				const room = `empty${ data.random }`;
				await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(10000);
				// await device.launchApp({ newInstance: true });
				await element(by.id('rooms-list-view-create-channel')).tap();
				await waitFor(element(by.id('new-message-view'))).toExist().withTimeout(5000);
				await element(by.id('new-message-view-create-channel')).tap();
				await waitFor(element(by.id('select-users-view'))).toExist().withTimeout(5000);
				await element(by.id('selected-users-view-submit')).tap();
				await waitFor(element(by.id('create-channel-view'))).toExist().withTimeout(10000);
				await element(by.id('create-channel-name')).replaceText(room);
				await element(by.id('create-channel-submit')).tap();
				await waitFor(element(by.id('room-view'))).toExist().withTimeout(60000);
				await expect(element(by.id('room-view'))).toExist();
				await waitFor(element(by.id(`room-view-title-${ room }`))).toExist().withTimeout(60000);
				await expect(element(by.id(`room-view-title-${ room }`))).toExist();
				await tapBack();
				await waitFor(element(by.id('rooms-list-view'))).toExist().withTimeout(2000);
				await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toExist().withTimeout(60000);
				await expect(element(by.id(`rooms-list-view-item-${ room }`))).toExist();
			});
		})
	});
});
