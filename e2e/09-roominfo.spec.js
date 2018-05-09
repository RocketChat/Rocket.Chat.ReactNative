const {
	device, expect, element, by, waitFor
} = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');
const { login } = require('./helpers/app');
const data = require('./data');

const scrollDown = 50;

async function navigateToRoomInfo(type) {
	let room;
	if (type === 'd') {
		room = 'rocket.cat';
	} else {
		room = `private${ data.random }`;
	}
    await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toBeVisible().withTimeout(2000);
    await element(by.id(`rooms-list-view-item-${ room }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(2000);
	await element(by.id('room-view-header-title')).tap();
	await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
}

describe('Room info screen', () => {
	before(async() => {
		// await device.launchApp({ delete: true, permissions: { notifications: 'YES' } });
		// await addServer();
    	// await navigateToLogin();
		// await login();
		await device.reloadReactNative();
	});

	describe('Render Info', async() => {
		describe('Channel/Group', async() => {
			before(async() => {
				await navigateToRoomInfo('c');
			});

			it('should have room info view', async() => {
				await expect(element(by.id('room-info-view'))).toBeVisible();
			});

			it('should have name', async() => {
				await expect(element(by.id('room-info-view-name'))).toBeVisible();
			});

			it('should have description', async() => {
				await expect(element(by.id('room-info-view-description'))).toBeVisible();
			});

			it('should have topic', async() => {
				await expect(element(by.id('room-info-view-topic'))).toBeVisible();
			});

			it('should have announcement', async() => {
				await expect(element(by.id('room-info-view-announcement'))).toBeVisible();
			});

			it('should have edit button', async() => {
				await expect(element(by.id('room-info-view-edit-button'))).toBeVisible();
			});

			after(async() => {
				takeScreenshot();
			});
		});

		describe('Direct', async() => {
			before(async() => {
				await device.reloadReactNative();
				await navigateToRoomInfo('d');
			});

			it('should navigate to room info', async() => {
				await expect(element(by.id('room-info-view'))).toBeVisible();
			});

			it('should navigate to room name', async() => {
				await expect(element(by.id('room-info-view-name'))).toBeVisible();
			});

			after(async() => {
				takeScreenshot();
			});
		});
	});

	describe('Render Edit', async() => {
		before(async() => {
			await device.reloadReactNative();
			await navigateToRoomInfo('c');
			await element(by.id('room-info-view-edit-button')).tap();
			await waitFor(element(by.id('room-info-edit-view'))).toBeVisible().withTimeout(2000);
		});

		it('should have room info edit view', async() => {
			await expect(element(by.id('room-info-edit-view'))).toExist();
		});

		it('should have name input', async() => {
			await expect(element(by.id('room-info-edit-view-name'))).toBeVisible();
		});

		it('should have description input', async() => {
			await expect(element(by.id('room-info-edit-view-description'))).toBeVisible();
		});

		it('should have topic input', async() => {
			await expect(element(by.id('room-info-edit-view-topic'))).toBeVisible();
		});

		it('should have announcement input', async() => {
			await expect(element(by.id('room-info-edit-view-announcement'))).toBeVisible();
		});

		it('should have password input', async() => {
			await expect(element(by.id('room-info-edit-view-password'))).toBeVisible();
		});

		it('should have type switch', async() => {
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await expect(element(by.id('room-info-edit-view-t'))).toBeVisible();
		});

		it('should have ready only switch', async() => {
			await expect(element(by.id('room-info-edit-view-ro'))).toBeVisible();
		});

		it('should have submit button', async() => {
			await expect(element(by.id('room-info-edit-view-submit'))).toBeVisible();
		});

		it('should have reset button', async() => {
			await expect(element(by.id('room-info-edit-view-reset'))).toBeVisible();
		});

		it('should have archive button', async() => {
			await expect(element(by.id('room-info-edit-view-archive'))).toBeVisible();
		});

		it('should have delete button', async() => {
			await expect(element(by.id('room-info-edit-view-delete'))).toBeVisible();
		});

		after(async() => {
			takeScreenshot();
		});
	});

	describe('Usage', async() => {
		const room = `private${ data.random }`;
		beforeEach(async() => {
			await device.reloadReactNative();
			await navigateToRoomInfo('c');
			await element(by.id('room-info-view-edit-button')).tap();
			await waitFor(element(by.id('room-info-edit-view'))).toBeVisible().withTimeout(2000);
		});

		it('should enter "invalid name" and get error', async() => {
			await element(by.id('room-info-edit-view-name')).replaceText('invalid name');
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-submit')).tap();
			await waitFor(element(by.text('There was an error while saving settings!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('There was an error while saving settings!'))).toBeVisible();
		});

		it('should change room name', async() => {
			await element(by.id('room-info-edit-view-name')).replaceText(`${ room }new`);
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-submit')).tap();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeVisible();
			await element(by.id('header-back')).atIndex(0).tap();
			await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('room-info-view-name'))).toHaveText(`${ room }new`);
			// change name to original
			await element(by.id('room-info-view-edit-button')).tap();
			await waitFor(element(by.id('room-info-edit-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('room-info-edit-view-name')).replaceText(`${ room }`);
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-submit')).tap();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeVisible();
		});

		it('should reset form', async() => {
			await element(by.id('room-info-edit-view-name')).replaceText('abc');
			await element(by.id('room-info-edit-view-description')).replaceText('abc');
			await element(by.id('room-info-edit-view-topic')).replaceText('abc');
			await element(by.id('room-info-edit-view-announcement')).replaceText('abc');
			await element(by.id('room-info-edit-view-password')).replaceText('abc');
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-t')).tap();
			await element(by.id('room-info-edit-view-ro')).tap();
			await element(by.id('room-info-edit-view-react-when-ro')).tap();
			await element(by.id('room-info-edit-view-reset')).tap();
			// after reset
			await expect(element(by.id('room-info-edit-view-name'))).toHaveText(room);
			await expect(element(by.id('room-info-edit-view-description'))).toHaveText('');
			await expect(element(by.id('room-info-edit-view-topic'))).toHaveText('');
			await expect(element(by.id('room-info-edit-view-announcement'))).toHaveText('');
			await expect(element(by.id('room-info-edit-view-password'))).toHaveText('');
			await expect(element(by.id('room-info-edit-view-t'))).toHaveValue('1');
			await expect(element(by.id('room-info-edit-view-ro'))).toHaveValue('0');
			await expect(element(by.id('room-info-edit-view-react-when-ro'))).toBeNotVisible();
		});

		it('should change room description', async() => {
			await element(by.id('room-info-edit-view-description')).replaceText('new description');
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-submit')).tap();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeVisible();
			await element(by.id('header-back')).atIndex(0).tap();
			await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('room-info-view-description'))).toHaveText('new description');
		});

		it('should change room topic', async() => {
			await element(by.id('room-info-edit-view-topic')).replaceText('new topic');
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-submit')).tap();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeVisible();
			await element(by.id('header-back')).atIndex(0).tap();
			await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('room-info-view-topic'))).toHaveText('new topic');
		});

		it('should change room announcement', async() => {
			await element(by.id('room-info-edit-view-announcement')).replaceText('new announcement');
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-submit')).tap();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeVisible();
			await element(by.id('header-back')).atIndex(0).tap();
			await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('room-info-view-announcement'))).toHaveText('new announcement');
		});

		it('should change room password', async() => {
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-password')).replaceText('password');
			await element(by.id('room-info-edit-view-submit')).tap();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeVisible();
		});

		it('should change room type', async() => {
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-t')).tap();
			await element(by.id('room-info-edit-view-submit')).tap();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeVisible();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeNotVisible().withTimeout(10000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeNotVisible();
			await element(by.id('room-info-edit-view-t')).tap();
			await element(by.id('room-info-edit-view-submit')).tap();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeVisible();
		});

		it('should toggle room read only', async() => {
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-ro')).tap();
			await element(by.id('room-info-edit-view-submit')).tap();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeVisible();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeNotVisible().withTimeout(10000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeNotVisible();
			await element(by.id('room-info-edit-view-ro')).tap();
			await element(by.id('room-info-edit-view-submit')).tap();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeVisible();
			// TODO: test if room is really read only?
		});

		it('should change room read only and allow reactions', async() => {
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-ro')).tap();
			await waitFor(element(by.id('room-info-edit-view-react-when-ro'))).toBeVisible().withTimeout(2000);
			await expect(element(by.id('room-info-edit-view-react-when-ro'))).toBeVisible();
			await element(by.id('room-info-edit-view-react-when-ro')).tap();
			await element(by.id('room-info-edit-view-submit')).tap();
			await waitFor(element(by.text('Settings succesfully changed!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Settings succesfully changed!'))).toBeVisible();
			// TODO: test if it's possible to react
		});

		// TODO: needs delete permission
		it('should NOT delete room', async() => {
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-delete')).tap();
		});

		it('should archive room', async() => {
			await element(by.id('room-info-edit-view-list')).swipe('up');
			await element(by.id('room-info-edit-view-archive')).tap();
			await waitFor(element(by.text('Yes, archive it!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Yes, archive it!'))).toBeVisible();
			await element(by.text('Yes, archive it!')).tap();
			await waitFor(element(by.text('UNARCHIVE'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('UNARCHIVE'))).toBeVisible();
			await element(by.id('room-info-edit-view-archive')).tap();
			await waitFor(element(by.text('Yes, unarchive it!'))).toBeVisible().withTimeout(5000);
			await expect(element(by.text('Yes, unarchive it!'))).toBeVisible();
			await element(by.text('Yes, unarchive it!')).tap();
		});

		after(async() => {
			takeScreenshot();
		});
	});
});
