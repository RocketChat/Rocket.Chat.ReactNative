import { device, waitFor, element, by } from 'detox';

import { navigateToLogin, login, tapBack, platformTypes, TTextMatcher, sleep, navigateToRoom } from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';
import random from '../../helpers/random';

const toBeConverted = `to-be-converted-${random()}`;
const toBeMoved = `to-be-moved-${random()}`;

const createChannel = async (room: string) => {
	await waitFor(element(by.id('rooms-list-view-create-channel')))
		.toBeVisible()
		.withTimeout(5000);
	await element(by.id('rooms-list-view-create-channel')).tap();
	await waitFor(element(by.id('new-message-view')))
		.toBeVisible()
		.withTimeout(5000);
	await waitFor(element(by.id('new-message-view-create-channel')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('new-message-view-create-channel')).tap();
	await waitFor(element(by.id('select-users-view')))
		.toExist()
		.withTimeout(5000);
	await element(by.id('selected-users-view-submit')).tap();
	await waitFor(element(by.id('create-channel-view')))
		.toExist()
		.withTimeout(10000);
	await element(by.id('create-channel-name')).replaceText(room);
	await element(by.id('create-channel-name')).tapReturnKey();
	await waitFor(element(by.id('create-channel-submit')))
		.toExist()
		.withTimeout(10000);
	await element(by.id('create-channel-submit')).tap();
	await waitFor(element(by.id('room-view')))
		.toExist()
		.withTimeout(60000);
	await waitFor(element(by.id(`room-view-title-${room}`)))
		.toExist()
		.withTimeout(60000);
	await tapBack();
	await waitFor(element(by.id('rooms-list-view')))
		.toExist()
		.withTimeout(2000);
	await waitFor(element(by.id(`rooms-list-view-item-${room}`)))
		.toExist()
		.withTimeout(60000);
};

async function navigateToRoomActions(room: string) {
	await navigateToRoom(room);
	await element(by.id('room-header')).tap();
	await waitFor(element(by.id('room-actions-view')))
		.toExist()
		.withTimeout(5000);
}

describe.skip('Move/Convert Team', () => {
	let alertButtonType: string;
	let textMatcher: TTextMatcher;
	let user: ITestUser;
	beforeAll(async () => {
		user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
	});

	describe('Convert', () => {
		beforeAll(async () => {
			await createChannel(toBeConverted);
		});

		it('should convert channel to a team', async () => {
			await navigateToRoomActions(toBeConverted);
			await element(by.id('room-actions-scrollview')).scrollTo('bottom');
			await waitFor(element(by.id('room-actions-convert-to-team')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('room-actions-convert-to-team')).tap();
			await waitFor(element(by[textMatcher]('You are converting this Channel to a Team. All Members will be kept.')))
				.toExist()
				.withTimeout(2000);
			await element(by[textMatcher]('Convert').and(by.type(alertButtonType))).tap();
			await waitFor(element(by.id('room-view')))
				.toExist()
				.withTimeout(20000);
			await waitFor(element(by.id(`room-view-title-${toBeConverted}`)))
				.toExist()
				.withTimeout(6000);
		});

		afterAll(async () => {
			await tapBack();
			await waitFor(element(by.id('rooms-list-view')))
				.toExist()
				.withTimeout(2000);
		});
	});

	describe('Move', () => {
		beforeAll(async () => {
			await createChannel(toBeMoved);
		});

		it('should move channel to a team', async () => {
			await navigateToRoomActions(toBeMoved);
			await element(by.id('room-actions-scrollview')).scrollTo('bottom');
			await waitFor(element(by.id('room-actions-move-to-team')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('room-actions-move-to-team')).tap();
			await sleep(300); // wait for animation
			await waitFor(element(by.id('select-list-view-submit')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('select-list-view-submit')).tap();
			await waitFor(element(by.id(`select-list-view-item-${toBeConverted}`)))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id(`select-list-view-item-${toBeConverted}`)).tap();
			await element(by.id('select-list-view-submit')).atIndex(0).tap();
			await waitFor(
				element(
					by[textMatcher](
						'After reading the previous intructions about this behavior, do you still want to move this channel to the selected team?'
					)
				)
			)
				.toBeVisible()
				.withTimeout(2000);
			await element(by[textMatcher]('Yes, move it!').and(by.type(alertButtonType))).tap();
			await waitFor(element(by.id('room-view-header-team-channels')))
				.toBeVisible()
				.withTimeout(10000);
		});

		afterAll(async () => {
			await tapBack();
			await waitFor(element(by.id('rooms-list-view')))
				.toExist()
				.withTimeout(2000);
		});
	});

	describe('Convert Team to Channel and Delete toBeMoved channel within the Converted', () => {
		it('should convert a team to a channel', async () => {
			await navigateToRoomActions(toBeConverted);
			await element(by.id('room-actions-scrollview')).scrollTo('bottom');
			await waitFor(element(by[textMatcher]('Convert to Channel')))
				.toExist()
				.withTimeout(2000);
			await element(by[textMatcher]('Convert to Channel')).atIndex(0).tap();
			await waitFor(element(by[textMatcher]('Converting Team to Channel')))
				.toExist()
				.withTimeout(2000);
			await waitFor(element(by.id(`select-list-view-item-${toBeMoved}`)))
				.toExist()
				.withTimeout(2000);
			await sleep(300); // wait for animation
			await element(by.id(`select-list-view-item-${toBeMoved}`)).tap();
			await waitFor(element(by.id('select-list-view-submit')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('select-list-view-submit')).tap();
			await waitFor(element(by[textMatcher]('You are converting this Team to a Channel')))
				.toExist()
				.withTimeout(2000);
			await element(by[textMatcher]('Convert').and(by.type(alertButtonType))).tap();
			await waitFor(element(by.id('room-view')))
				.toExist()
				.withTimeout(20000);
			await waitFor(element(by.id(`room-view-title-${toBeConverted}`)))
				.toExist()
				.withTimeout(6000);
			await tapBack();
			await waitFor(element(by.id('rooms-list-view')))
				.toExist()
				.withTimeout(2000);
			await waitFor(element(by.id(`rooms-list-view-item-${toBeMoved}`)))
				.toBeNotVisible()
				.withTimeout(60000);
		});
	});
});
