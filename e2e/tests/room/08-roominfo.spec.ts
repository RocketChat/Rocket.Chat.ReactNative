import Detox, { device, waitFor, element, by, expect } from 'detox';

import { navigateToLogin, login, tapBack, sleep, platformTypes, TTextMatcher, navigateToRoom } from '../../helpers/app';
import { createRandomRoom, createRandomUser, ITestUser } from '../../helpers/data_setup';

async function navigateToRoomInfo(room: string) {
	await navigateToRoom(room);
	await element(by.id('room-header')).tap();
	await waitFor(element(by.id('room-actions-view')))
		.toExist()
		.withTimeout(5000);
	await element(by.id('room-actions-info')).tap();
	await waitFor(element(by.id('room-info-view')))
		.toExist()
		.withTimeout(2000);
}

async function swipe(direction: Detox.Direction) {
	await element(by.id('room-info-edit-view-list')).swipe(direction, 'fast', 1);
}

async function waitForToast() {
	await sleep(300);
}

describe('Room info screen', () => {
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	let room: string;
	let user: ITestUser;
	beforeAll(async () => {
		user = await createRandomUser();
		({ name: room } = await createRandomRoom(user, 'p'));
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
	});

	describe('Channel/Group', () => {
		beforeAll(async () => {
			await navigateToRoomInfo(room);
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
			beforeAll(async () => {
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

			afterAll(async () => {
				await swipe('down');
			});
		});

		describe('Usage', () => {
			it('should reset form', async () => {
				await element(by.id('room-info-edit-view-name')).replaceText('abc');
				await element(by.id('room-info-edit-view-name')).tapReturnKey();
				await element(by.id('room-info-edit-view-topic')).replaceText('abc');
				await element(by.id('room-info-edit-view-topic')).tapReturnKey();
				await element(by.id('room-info-edit-view-announcement')).replaceText('abc');
				await element(by.id('room-info-edit-view-announcement')).tapReturnKey();
				await element(by.id('room-info-edit-view-description')).replaceText('abc');
				await element(by.id('room-info-edit-view-description')).tapReturnKey();
				await element(by.id('room-info-edit-view-password')).replaceText('abc');
				await element(by.id('room-info-edit-view-password')).tapReturnKey();
				await swipe('up');
				await element(by.id('room-info-edit-view-t')).tap();
				await element(by.id('room-info-edit-view-ro')).tap();
				await element(by.id('room-info-edit-view-react-when-ro')).tap();
				await swipe('up');
				await element(by.id('room-info-edit-view-reset')).tap();
				// after reset
				await expect(element(by.id('room-info-edit-view-name'))).toHaveText(room);
				await expect(element(by.id('room-info-edit-view-topic'))).toHaveText('');
				await expect(element(by.id('room-info-edit-view-announcement'))).toHaveText('');
				await expect(element(by.id('room-info-edit-view-description'))).toHaveText('');
				await expect(element(by.id('room-info-edit-view-password'))).toHaveText('');
				await expect(element(by.id('room-info-edit-view-t'))).toHaveToggleValue(true);
				await expect(element(by.id('room-info-edit-view-ro'))).toHaveToggleValue(false);
				await expect(element(by.id('room-info-edit-view-react-when-ro'))).not.toBeVisible();
				await swipe('down');
			});

			it('should change room name', async () => {
				await element(by.id('room-info-edit-view-name')).replaceText(`${room}new`);
				await swipe('down'); // dismiss keyboard
				await swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await tapBack();
				await waitFor(element(by.id('room-info-view')))
					.toExist()
					.withTimeout(2000);
				const matcher = device.getPlatform() === 'android' ? 'toHaveText' : 'toHaveLabel';
				await waitFor(element(by.id('room-info-view-name')))
					[matcher](`${room}new`)
					.withTimeout(10000);
				await element(by.id('room-info-view-edit-button')).tap();
				await waitFor(element(by.id('room-info-edit-view')))
					.toExist()
					.withTimeout(2000);
			});

			it('should change room description, topic, announcement', async () => {
				await sleep(5000); // wait for changes to be applied from socket
				await element(by.id('room-info-edit-view-topic')).replaceText('new topic');
				await element(by.id('room-info-edit-view-topic')).tapReturnKey();
				await element(by.id('room-info-edit-view-announcement')).replaceText('new announcement');
				await element(by.id('room-info-edit-view-announcement')).tapReturnKey();
				await element(by.id('room-info-edit-view-description')).replaceText('new description');
				await element(by.id('room-info-edit-view-description')).tapReturnKey();
				await element(by.id('room-info-edit-view-password')).tapReturnKey();
				await swipe('up');
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
				await tapBack();
				await waitFor(element(by.id('room-info-view')))
					.toExist()
					.withTimeout(2000);
				await waitFor(element(by[textMatcher]('new description').withAncestor(by.id('room-info-view-description'))))
					.toExist()
					.withTimeout(10000);
				await expect(element(by[textMatcher]('new topic').withAncestor(by.id('room-info-view-topic')))).toExist();
				await expect(element(by[textMatcher]('new announcement').withAncestor(by.id('room-info-view-announcement')))).toExist();

				await element(by.id('room-info-view-edit-button')).tap();
				await waitFor(element(by.id('room-info-edit-view')))
					.toExist()
					.withTimeout(2000);
			});

			// Commented because we're not actually asserting anything
			// it('should change room password', async () => {
			// 	await waitFor(element(by.id('room-info-view-edit-button')))
			// 		.toExist()
			// 		.withTimeout(10000);
			// 	await element(by.id('room-info-view-edit-button')).tap();
			// 	await waitFor(element(by.id('room-info-edit-view')))
			// 		.toExist()
			// 		.withTimeout(2000);
			// 	await sleep(2000);
			// 	await element(by.id('room-info-edit-view-password')).replaceText('password');
			// 	await element(by.id('room-info-edit-view-list')).swipe('up', 'fast', 0.5);
			// 	await element(by.id('room-info-edit-view-submit')).tap();
			// 	await waitForToast();
			// });

			it('should change room type', async () => {
				await sleep(300);
				await swipe('up');
				await element(by.id('room-info-edit-view-t')).tap();
				await element(by.id('room-info-edit-view-submit')).tap();
				await waitForToast();
			});

			it('should archive room', async () => {
				await swipe('up');
				await element(by.id('room-info-edit-view-archive')).tap();
				await waitFor(element(by[textMatcher]('Yes, archive it!')))
					.toExist()
					.withTimeout(5000);
				await element(by[textMatcher]('Yes, archive it!').and(by.type(alertButtonType))).tap();
				await waitForToast();
			});

			it('should delete room', async () => {
				await element(by.id('room-info-edit-view-list')).swipe('up');
				await element(by.id('room-info-edit-view-delete')).tap();
				await waitFor(element(by[textMatcher]('Yes, delete it!')))
					.toExist()
					.withTimeout(5000);
				await element(by[textMatcher]('Yes, delete it!').and(by.type(alertButtonType))).tap();
				await waitFor(element(by.id(`rooms-list-view-item-${room}new`)))
					.not.toBeVisible()
					.withTimeout(60000);
			});
		});

		describe('Navigate to random user', () => {
			it('should see user role correctly', async () => {
				await navigateToRoomInfo('roles-test');
				await waitFor(element(by.id(`user-roles`)))
					.toBeVisible()
					.withTimeout(10000);
				await waitFor(element(by.id(`user-role-Livechat-Agent`)))
					.toBeVisible()
					.withTimeout(10000);
			});
		});

		describe('Navigate to user status-test', () => {
			it('Back to rooms list view', async () => {
				await tapBack();
				await sleep(300);
				await tapBack();
				await sleep(300);
				await tapBack();
				await sleep(300);
			});
			it('should see the status text with show more label', async () => {
				const statusTextExpected =
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam laoreet odio lectus, nec varius nisi semper ut porta ante';
				await navigateToRoomInfo('status-test');
				await waitFor(element(by.id(`collapsible-text-truncated-${statusTextExpected}`)))
					.toBeVisible()
					.withTimeout(10000);
				await sleep(400);
				const textWithShowMoreRegExp = /Lorem[\s\S]+... Show more/i;
				await waitFor(element(by[textMatcher](textWithShowMoreRegExp)))
					.toExist()
					.withTimeout(10000);
				await element(by.id(`collapsible-text-truncated-${statusTextExpected}`)).tap({ x: 320, y: 24 });
				await waitFor(element(by.id(`collapsible-text-${statusTextExpected}`)))
					.toBeVisible()
					.withTimeout(10000);
			});
		});
	});
});
