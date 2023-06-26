import { device, waitFor, element, by } from 'detox';

import { navigateToLogin, login, tapBack, platformTypes, TTextMatcher, sleep, navigateToRoom } from '../../helpers/app';
import { createRandomUser, ITestUser } from '../../helpers/data_setup';
import random from '../../helpers/random';

const toBeConverted = `to-be-converted-${random()}`;
const toBeMoved = `to-be-moved-${random()}`;
const publicChannelToBeConverted = `channel-public-to-be-converted-${random()}`;

const createChannel = async (room: string, publicChannel?: boolean) => {
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
	if (publicChannel) {
		await element(by.id('create-channel-type')).tap();
	}
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

describe('Move/Convert Team', () => {
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
		it('should convert public channel to a team', async () => {
			await createChannel(publicChannelToBeConverted, true);
			await navigateToRoomActions(publicChannelToBeConverted);
			await element(by.id('room-actions-scrollview')).scrollTo('bottom');
			await waitFor(element(by.id('room-actions-convert-to-team')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('room-actions-convert-to-team')).tap();
			await waitFor(element(by[textMatcher]('You are converting this channel to a team. All members will be kept.')))
				.toExist()
				.withTimeout(2000);
			await element(by[textMatcher]('Convert').and(by.type(alertButtonType))).tap();
			await waitFor(element(by.id('room-view')))
				.toExist()
				.withTimeout(20000);
			await waitFor(element(by.id(`room-view-title-${publicChannelToBeConverted}`)))
				.toExist()
				.withTimeout(6000);
		});

		it('should convert private channel to a team', async () => {
			await createChannel(toBeConverted);
			await navigateToRoomActions(toBeConverted);
			await element(by.id('room-actions-scrollview')).scrollTo('bottom');
			await waitFor(element(by.id('room-actions-convert-to-team')))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id('room-actions-convert-to-team')).tap();
			await waitFor(element(by[textMatcher]('You are converting this channel to a team. All members will be kept.')))
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

		afterEach(async () => {
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
						'After reading the previous instructions about this behavior, do you still want to move this channel to the selected team?'
					)
				)
			)
				.toBeVisible()
				.withTimeout(2000);
			await element(by[textMatcher]('Yes, move it!').and(by.type(alertButtonType))).tap();
			await sleep(300); // wait for animation
			await element(by.id('room-header')).tap();
			await waitFor(element(by.id(`room-actions-teams`)))
				.toExist()
				.withTimeout(6000);
			await tapBack();
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
			await waitFor(element(by[textMatcher]('Convert to channel')))
				.toExist()
				.withTimeout(2000);
			await element(by[textMatcher]('Convert to channel')).atIndex(0).tap();
			await waitFor(element(by[textMatcher]('Converting team to channel')))
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
			await waitFor(element(by[textMatcher]('You are converting this team to a channel')))
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
