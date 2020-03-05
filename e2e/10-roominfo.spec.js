const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('./data');
const { tapBack, sleep } = require('./helpers/app');

async function navigateToRoomInfo(type) {
	let room;
	if (type === 'd') {
		room = 'rocket.cat';
	} else {
		room = `private${ data.random }`;
	}
	await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
	await element(by.type('UIScrollView')).atIndex(1).scrollTo('top');
	await element(by.id('rooms-list-view-search')).typeText(room);
	await sleep(2000);
	await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toExist().withTimeout(60000);
	await element(by.id(`rooms-list-view-item-${ room }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(2000);
	await sleep(1000);
	await element(by.id('room-view-header-actions')).tap();
	await waitFor(element(by.id('room-actions-view'))).toBeVisible().withTimeout(5000);
	await sleep(1000);
	await element(by.id('room-actions-info')).tap();
	await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
}

async function waitForToast() {
	// await waitFor(element(by.id('toast'))).toBeVisible().withTimeout(10000);
	// await expect(element(by.id('toast'))).toBeVisible();
	// await waitFor(element(by.id('toast'))).toBeNotVisible().withTimeout(10000);
	// await expect(element(by.id('toast'))).toBeNotVisible();
	await sleep(5000);
}

describe('Room info screen', () => {
	describe('Direct', async() => {
		before(async() => {
			await device.launchApp({ newInstance: true });
			await navigateToRoomInfo('d');
		});

		it('should navigate to room info', async() => {
			await expect(element(by.id('room-info-view'))).toBeVisible();
			await expect(element(by.id('room-info-view-name'))).toBeVisible();
		});
	});

	describe('Channel/Group', async() => {
		before(async() => {
			await device.launchApp({ newInstance: true });
			await navigateToRoomInfo('c');
		});

		describe('Render', async() => {
			it('should have room info view', async() => {
				await expect(element(by.id('room-info-view'))).toBeVisible();
			});
	
			it('should have name', async() => {
				await expect(element(by.id('room-info-view-name'))).toBeVisible();
			});
	
			it('should have description', async() => {
				await expect(element(by.label('Description'))).toBeVisible();
			});
	
			it('should have topic', async() => {
				await expect(element(by.label('Topic'))).toBeVisible();
			});
	
			it('should have announcement', async() => {
				await expect(element(by.label('Announcement'))).toBeVisible();
			});
	
			it('should have edit button', async() => {
				await expect(element(by.id('room-info-view-edit-button'))).toBeVisible();
			});
		});

		describe('Render Edit', async() => {
			before(async() => {
				await sleep(1000);
				await waitFor(element(by.id('room-info-view-edit-button'))).toBeVisible().withTimeout(10000);
				await element(by.id('room-info-view-edit-button')).tap();
				await waitFor(element(by.id('room-info-edit-view'))).toBeVisible().withTimeout(2000);
			});
	
			it('should have room info edit view', async() => {
				await expect(element(by.id('room-info-edit-view'))).toExist();
			});
	
			it('should have name input', async() => {
				await expect(element(by.id('room-info-edit-view-name'))).toExist();
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
				// Ugly hack to scroll on detox
				await element(by.type('UIScrollView')).atIndex(1).swipe('up');
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
				// Ugly hack to scroll on detox
				await element(by.type('UIScrollView')).atIndex(1).swipe('down');
			});
		});
	
		describe('Usage', async() => {
			const room = `private${ data.random }`;
			// it('should enter "invalid name" and get error', async() => {
			// 	await element(by.type('UIScrollView')).atIndex(1).swipe('down');
			// 	await element(by.id('room-info-edit-view-name')).replaceText('invalid name');
			// 	await element(by.type('UIScrollView')).atIndex(1).swipe('up');
			// 	await element(by.id('room-info-edit-view-submit')).tap();
			// 	await waitFor(element(by.text('There was an error while saving settings!'))).toBeVisible().withTimeout(60000);
			// 	await expect(element(by.text('There was an error while saving settings!'))).toBeVisible();
			// 	await element(by.text('OK')).tap();
			// 	await waitFor(element(by.text('There was an error while saving settings!'))).toBeNotVisible().withTimeout(10000);
			// 	await element(by.type('UIScrollView')).atIndex(1).swipe('down');
			// });
	
			it('should change room name', async() => {
				await element(by.id('room-info-edit-view-name')).replaceText(`${ room }new`);
				await element(by.type('UIScrollView')).atIndex(1).swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await sleep(5000);
				await tapBack();
				await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
				await sleep(1000);
				await expect(element(by.id('room-info-view-name'))).toHaveLabel(`${ room }new`);
				// change name to original
				await element(by.id('room-info-view-edit-button')).tap();
				await sleep(1000);
				await waitFor(element(by.id('room-info-edit-view'))).toBeVisible().withTimeout(2000);
				await element(by.id('room-info-edit-view-name')).replaceText(`${ room }`);
				await element(by.type('UIScrollView')).atIndex(1).swipe('up');
				await sleep(1000);
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await element(by.type('UIScrollView')).atIndex(1).swipe('down');
			});
	
			it('should reset form', async() => {
				await element(by.id('room-info-edit-view-name')).replaceText('abc');
				await element(by.id('room-info-edit-view-description')).replaceText('abc');
				await element(by.id('room-info-edit-view-topic')).replaceText('abc');
				await element(by.id('room-info-edit-view-announcement')).replaceText('abc');
				await element(by.id('room-info-edit-view-password')).replaceText('abc');
				await element(by.type('UIScrollView')).atIndex(1).swipe('up');
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
				await element(by.type('UIScrollView')).atIndex(1).swipe('down');
			});
	
			it('should change room description', async() => {
				await sleep(1000);
				await element(by.id('room-info-edit-view-description')).replaceText('new description');
				await element(by.type('UIScrollView')).atIndex(1).swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await tapBack();
				await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
				await sleep(1000);
				// await expect(element(by.id('room-info-view-description'))).toHaveLabel('new description');
				await expect(element(by.label('new description'))).toBeVisible();
				await waitFor(element(by.id('room-info-view-edit-button'))).toBeVisible().withTimeout(10000);
				await element(by.id('room-info-view-edit-button')).tap();
				await waitFor(element(by.id('room-info-edit-view'))).toBeVisible().withTimeout(2000);
			});
	
			it('should change room topic', async() => {
				await sleep(1000);
				await element(by.id('room-info-edit-view-topic')).replaceText('new topic');
				await element(by.type('UIScrollView')).atIndex(1).swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await tapBack();
				await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
				await sleep(1000);
				// await expect(element(by.id('room-info-view-topic'))).toHaveLabel('new topic');
				await expect(element(by.label('new topic'))).toBeVisible();
				await waitFor(element(by.id('room-info-view-edit-button'))).toBeVisible().withTimeout(10000);
				await element(by.id('room-info-view-edit-button')).tap();
				await waitFor(element(by.id('room-info-edit-view'))).toBeVisible().withTimeout(2000);
			});
	
			it('should change room announcement', async() => {
				await sleep(1000);
				await element(by.id('room-info-edit-view-announcement')).replaceText('new announcement');
				await element(by.type('UIScrollView')).atIndex(1).swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await tapBack();
				await waitFor(element(by.id('room-info-view'))).toBeVisible().withTimeout(2000);
				await sleep(1000);
				// await expect(element(by.id('room-info-view-announcement'))).toHaveLabel('new announcement');
				await expect(element(by.label('new announcement'))).toBeVisible();
				await waitFor(element(by.id('room-info-view-edit-button'))).toBeVisible().withTimeout(10000);
				await element(by.id('room-info-view-edit-button')).tap();
				await waitFor(element(by.id('room-info-edit-view'))).toBeVisible().withTimeout(2000);
			});
	
			it('should change room password', async() => {
				await sleep(1000);
				await element(by.type('UIScrollView')).atIndex(1).swipe('up');
				await element(by.id('room-info-edit-view-password')).replaceText('password');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
			});
	
			it('should change room type', async() => {
				await sleep(1000);
				await element(by.type('UIScrollView')).atIndex(1).swipe('up');
				await element(by.id('room-info-edit-view-t')).tap();
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await element(by.id('room-info-edit-view-t')).tap();
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
			});
	
			// it('should change room read only and allow reactions', async() => {
			// 	await sleep(1000);
			// 	await element(by.type('UIScrollView')).atIndex(1).swipe('up');
			// 	await element(by.id('room-info-edit-view-ro')).tap();
			// 	await waitFor(element(by.id('room-info-edit-view-react-when-ro'))).toBeVisible().withTimeout(2000);
			// 	await expect(element(by.id('room-info-edit-view-react-when-ro'))).toBeVisible();
			// 	await element(by.id('room-info-edit-view-react-when-ro')).tap();
			// 	await element(by.id('room-info-edit-view-submit')).tap();
			// 	await waitForToast();
			// 	// TODO: test if it's possible to react
			// });
	
			it('should archive room', async() => {
				await sleep(1000);
				await element(by.type('UIScrollView')).atIndex(1).swipe('up');
				await element(by.id('room-info-edit-view-archive')).tap();
				await waitFor(element(by.text('Yes, archive it!'))).toBeVisible().withTimeout(5000);
				await expect(element(by.text('Yes, archive it!'))).toBeVisible();
				await element(by.text('Yes, archive it!')).tap();
				await waitFor(element(by.id('room-info-edit-view-unarchive'))).toBeVisible().withTimeout(60000);
				await expect(element(by.id('room-info-edit-view-unarchive'))).toBeVisible();
				await expect(element(by.id('room-info-edit-view-archive'))).toBeNotVisible();
				// TODO: needs permission to unarchive
				// await element(by.id('room-info-edit-view-archive')).tap();
				// await waitFor(element(by.text('Yes, unarchive it!'))).toBeVisible().withTimeout(5000);
				// await expect(element(by.text('Yes, unarchive it!'))).toBeVisible();
				// await element(by.text('Yes, unarchive it!')).tap();
				// await waitFor(element(by.text('ARCHIVE'))).toBeVisible().withTimeout(60000);
				// await expect(element(by.text('ARCHIVE'))).toBeVisible();
			});

			it('should delete room', async() => {
				await sleep(1000);
				await element(by.type('UIScrollView')).atIndex(1).swipe('up');
				await element(by.id('room-info-edit-view-delete')).tap();
				await waitFor(element(by.text('Yes, delete it!'))).toBeVisible().withTimeout(5000);
				await expect(element(by.text('Yes, delete it!'))).toBeVisible();
				await element(by.text('Yes, delete it!')).tap();
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
				// await element(by.id('rooms-list-view-search')).typeText('');
				await sleep(2000);
				await waitFor(element(by.id(`rooms-list-view-item-${ room }`))).toBeNotVisible().withTimeout(60000);
				await expect(element(by.id(`rooms-list-view-item-${ room }`))).toBeNotVisible();
			});
		});
	});
});
