const data = require('../../data');
const { navigateToLogin, login, tapBack, sleep, searchRoom, platformTypes } = require('../../helpers/app');

const privateRoomName = data.groups.private.name;

async function navigateToRoomInfo(type) {
	let room;
	if (type === 'd') {
		room = 'rocket.cat';
	} else {
		room = privateRoomName;
	}
	await searchRoom(room);
	await element(by.id(`rooms-list-view-item-${room}`)).tap();
	await waitFor(element(by.id('room-view')))
		.toExist()
		.withTimeout(2000);
	await element(by.id('room-header')).tap();
	await waitFor(element(by.id('room-actions-view')))
		.toExist()
		.withTimeout(5000);
	await element(by.id('room-actions-info')).tap();
	await waitFor(element(by.id('room-info-view')))
		.toExist()
		.withTimeout(2000);
}

async function swipe(direction) {
	await element(by.id('room-info-edit-view-list')).swipe(direction, 'fast', 0.8);
}

async function waitForToast() {
	await sleep(300);
}

describe('Room info screen', () => {
	let alertButtonType;
	let textMatcher;
	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
	});

	describe('Direct', () => {
		before(async () => {
			await navigateToRoomInfo('d');
		});

		it('should navigate to room info', async () => {
			await expect(element(by.id('room-info-view'))).toExist();
			await expect(element(by.id('room-info-view-name'))).toExist();
		});

		after(async () => {
			await tapBack();
			await tapBack();
			await tapBack();
		});
	});

	describe('Channel/Group', () => {
		before(async () => {
			await navigateToRoomInfo('c');
		});

		describe('Render', () => {
			it('should have room info view', async () => {
				await expect(element(by.id('room-info-view'))).toExist();
			});

			it('should have name', async () => {
				await expect(element(by.id('room-info-view-name'))).toExist();
			});

			it('should have description', async () => {
				await expect(element(by[textMatcher]('Description'))).toExist();
			});

			it('should have topic', async () => {
				await expect(element(by[textMatcher]('Topic'))).toExist();
			});

			it('should have announcement', async () => {
				await expect(element(by[textMatcher]('Announcement'))).toExist();
			});

			it('should have edit button', async () => {
				await expect(element(by.id('room-info-view-edit-button'))).toExist();
			});
		});

		describe('Render Edit', () => {
			before(async () => {
				await waitFor(element(by.id('room-info-view-edit-button')))
					.toExist()
					.withTimeout(10000);
				await element(by.id('room-info-view-edit-button')).tap();
				await waitFor(element(by.id('room-info-edit-view')))
					.toExist()
					.withTimeout(2000);
			});

			it('should have room info edit view', async () => {
				await expect(element(by.id('room-info-edit-view'))).toExist();
			});

			it('should have name input', async () => {
				await expect(element(by.id('room-info-edit-view-name'))).toExist();
			});

			it('should have description input', async () => {
				await expect(element(by.id('room-info-edit-view-description'))).toExist();
			});

			it('should have topic input', async () => {
				await expect(element(by.id('room-info-edit-view-topic'))).toExist();
			});

			it('should have announcement input', async () => {
				await expect(element(by.id('room-info-edit-view-announcement'))).toExist();
			});

			it('should have password input', async () => {
				await expect(element(by.id('room-info-edit-view-password'))).toExist();
			});

			it('should have type switch', async () => {
				await swipe('up');
				await expect(element(by.id('room-info-edit-view-t'))).toExist();
			});

			it('should have ready only switch', async () => {
				await expect(element(by.id('room-info-edit-view-ro'))).toExist();
			});

			it('should have submit button', async () => {
				await expect(element(by.id('room-info-edit-view-submit'))).toExist();
			});

			it('should have reset button', async () => {
				await expect(element(by.id('room-info-edit-view-reset'))).toExist();
			});

			it('should have archive button', async () => {
				await expect(element(by.id('room-info-edit-view-archive'))).toExist();
			});

			it('should have delete button', async () => {
				await expect(element(by.id('room-info-edit-view-delete'))).toExist();
			});

			after(async () => {
				await swipe('down');
			});
		});

		describe('Usage', () => {
			it('should change room name', async () => {
				await element(by.id('room-info-edit-view-name')).replaceText(`${privateRoomName}new`);
				await element(by.id('room-info-edit-view-list')).swipe('up', 'fast', 0.5);
				await swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await tapBack();
				await waitFor(element(by.id('room-info-view')))
					.toExist()
					.withTimeout(2000);
				const matcher = device.getPlatform() === 'android' ? 'toHaveText' : 'toHaveLabel';
				await expect(element(by.id('room-info-view-name')))[matcher](`${privateRoomName}new`);
				// change name to original
				await element(by.id('room-info-view-edit-button')).tap();
				await waitFor(element(by.id('room-info-edit-view')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('room-info-edit-view-name')).replaceText(`${privateRoomName}`);
				await swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await swipe('down');
			});

			it('should reset form', async () => {
				await element(by.id('room-info-edit-view-name')).replaceText('abc');
				await element(by.id('room-info-edit-view-description')).replaceText('abc');
				await element(by.id('room-info-edit-view-topic')).replaceText('abc');
				await element(by.id('room-info-edit-view-announcement')).replaceText('abc');
				await element(by.id('room-info-edit-view-password')).replaceText('abc');
				await element(by.id('room-info-edit-view-t')).tap();
				await swipe('up');
				await element(by.id('room-info-edit-view-ro')).longPress(); // https://github.com/facebook/react-native/issues/28032
				await element(by.id('room-info-edit-view-react-when-ro')).tap();
				await swipe('up');
				await element(by.id('room-info-edit-view-reset')).tap();
				// after reset
				await expect(element(by.id('room-info-edit-view-name'))).toHaveText(privateRoomName);
				await expect(element(by.id('room-info-edit-view-description'))).toHaveText('');
				await expect(element(by.id('room-info-edit-view-topic'))).toHaveText('');
				await expect(element(by.id('room-info-edit-view-announcement'))).toHaveText('');
				await expect(element(by.id('room-info-edit-view-password'))).toHaveText('');
				// await swipe('down');
				await expect(element(by.id('room-info-edit-view-t'))).toHaveToggleValue(true);
				await expect(element(by.id('room-info-edit-view-ro'))).toHaveToggleValue(false);
				await expect(element(by.id('room-info-edit-view-react-when-ro'))).toBeNotVisible();
				await swipe('down');
			});

			it('should change room description', async () => {
				await element(by.id('room-info-edit-view-description')).replaceText('new description');
				await swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await tapBack();
				await waitFor(element(by.id('room-info-view')))
					.toExist()
					.withTimeout(2000);
				await expect(element(by[textMatcher]('new description').withAncestor(by.id('room-info-view-description')))).toExist();
			});

			it('should change room topic', async () => {
				await waitFor(element(by.id('room-info-view-edit-button')))
					.toExist()
					.withTimeout(10000);
				await element(by.id('room-info-view-edit-button')).tap();
				await waitFor(element(by.id('room-info-edit-view')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('room-info-edit-view-topic')).replaceText('new topic');
				await swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await tapBack();
				await waitFor(element(by.id('room-info-view')))
					.toExist()
					.withTimeout(2000);
				await expect(element(by[textMatcher]('new topic').withAncestor(by.id('room-info-view-topic')))).toExist();
			});

			it('should change room announcement', async () => {
				await waitFor(element(by.id('room-info-view-edit-button')))
					.toExist()
					.withTimeout(10000);
				await element(by.id('room-info-view-edit-button')).tap();
				await waitFor(element(by.id('room-info-edit-view')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('room-info-edit-view-announcement')).replaceText('new announcement');
				await swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await tapBack();
				await waitFor(element(by.id('room-info-view')))
					.toExist()
					.withTimeout(2000);
				await expect(element(by[textMatcher]('new announcement').withAncestor(by.id('room-info-view-announcement')))).toExist();
			});

			it('should change room password', async () => {
				await waitFor(element(by.id('room-info-view-edit-button')))
					.toExist()
					.withTimeout(10000);
				await element(by.id('room-info-view-edit-button')).tap();
				await waitFor(element(by.id('room-info-edit-view')))
					.toExist()
					.withTimeout(2000);
				await element(by.id('room-info-edit-view-password')).replaceText('password');
				await swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
			});

			it('should change room type', async () => {
				await swipe('down');
				await element(by.id('room-info-edit-view-t')).tap();
				await swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await swipe('down');
				await element(by.id('room-info-edit-view-t')).tap();
				await swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
			});

			it('should archive room', async () => {
				await element(by.id('room-info-edit-view-list')).swipe('up', 'fast', 0.5);
				await element(by.id('room-info-edit-view-archive')).tap();
				await waitFor(element(by[textMatcher]('Yes, archive it!')))
					.toExist()
					.withTimeout(5000);
				await element(by[textMatcher]('Yes, archive it!').and(by.type(alertButtonType))).tap();
				await waitForToast();
				// await waitFor(element(by.id('room-info-edit-view-unarchive')))
				// 	.toExist()
				// 	.withTimeout(60000);
				// await expect(element(by.id('room-info-edit-view-archive'))).toBeNotVisible();
			});

			it('should delete room', async () => {
				await swipe('up');
				await element(by.id('room-info-edit-view-delete')).tap();
				await waitFor(element(by[textMatcher]('Yes, delete it!')))
					.toExist()
					.withTimeout(5000);
				await element(by[textMatcher]('Yes, delete it!').and(by.type(alertButtonType))).tap();
				await waitFor(element(by.id('rooms-list-view')))
					.toExist()
					.withTimeout(10000);
				await waitFor(element(by.id(`rooms-list-view-item-${privateRoomName}`)))
					.toBeNotVisible()
					.withTimeout(60000);
			});
		});
	});
});
