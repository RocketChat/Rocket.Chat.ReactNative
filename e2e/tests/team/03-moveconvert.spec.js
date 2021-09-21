const data = require('../../data');
const { navigateToLogin, login, tapBack, searchRoom, sleep } = require('../../helpers/app');

const toBeConverted = `to-be-converted-${data.random}`;
const toBeMoved = `to-be-moved-${data.random}`;

const createChannel = async room => {
	await element(by.id('rooms-list-view-create-channel')).tap();
	await waitFor(element(by.id('new-message-view')))
		.toExist()
		.withTimeout(5000);
	await element(by.id('new-message-view-create-channel')).tap();
	await waitFor(element(by.id('select-users-view')))
		.toExist()
		.withTimeout(5000);
	await element(by.id('selected-users-view-submit')).tap();
	await waitFor(element(by.id('create-channel-view')))
		.toExist()
		.withTimeout(10000);
	await element(by.id('create-channel-name')).typeText(room);
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

async function navigateToRoom(room) {
	await searchRoom(`${room}`);
	await element(by.id(`rooms-list-view-item-${room}`)).tap();
	await waitFor(element(by.id('room-view')))
		.toBeVisible()
		.withTimeout(5000);
}

async function navigateToRoomActions(room) {
	await navigateToRoom(room);
	await element(by.id('room-header')).tap();
	await waitFor(element(by.id('room-actions-view')))
		.toExist()
		.withTimeout(5000);
}

describe('Move/Convert Team', () => {
	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.users.regular.username, data.users.regular.password);
	});

	describe('Convert', () => {
		before(async () => {
			await createChannel(toBeConverted);
		});

		it('should convert channel to a team', async () => {
			await navigateToRoomActions(toBeConverted);
			await element(by.id('room-actions-scrollview')).scrollTo('bottom');
			await waitFor(element(by.id('room-actions-convert-to-team')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('room-actions-convert-to-team')).tap();
			await waitFor(element(by.label('You are converting this Channel to a Team. All Members will be kept.')))
				.toExist()
				.withTimeout(2000);
			await element(by.text('Convert')).tap();
			await waitFor(element(by.id('room-view')))
				.toExist()
				.withTimeout(20000);
			await waitFor(element(by.id(`room-view-title-${toBeConverted}`)))
				.toExist()
				.withTimeout(6000);
		});

		after(async () => {
			await tapBack();
			await waitFor(element(by.id('rooms-list-view')))
				.toExist()
				.withTimeout(2000);
		});
	});

	describe('Move', () => {
		before(async () => {
			await createChannel(toBeMoved);
		});

		it('should move channel to a team', async () => {
			await navigateToRoomActions(toBeMoved);
			await element(by.id('room-actions-scrollview')).scrollTo('bottom');
			await waitFor(element(by.id('room-actions-move-to-team')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('room-actions-move-to-team')).tap();
			await waitFor(element(by.id('select-list-view')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('select-list-view-submit')).tap();
			await sleep(2000);
			await waitFor(element(by.id('select-list-view')))
				.toExist()
				.withTimeout(2000);
			await waitFor(element(by.id(`select-list-view-item-${toBeConverted}`)))
				.toExist()
				.withTimeout(2000);
			await element(by.id(`select-list-view-item-${toBeConverted}`)).tap();
			await element(by.id('select-list-view-submit')).atIndex(0).tap();
			await waitFor(
				element(
					by.label(
						'After reading the previous intructions about this behavior, do you still want to move this channel to the selected team?'
					)
				)
			)
				.toExist()
				.withTimeout(2000);
			await element(by.text('Yes, move it!')).tap();
			await waitFor(element(by.id('room-view-header-team-channels')))
				.toExist()
				.withTimeout(10000);
		});

		after(async () => {
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
			await waitFor(element(by.id('room-actions-convert-channel-to-team')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('room-actions-convert-channel-to-team')).tap();
			await sleep(2000);
			await waitFor(element(by.id('select-list-view')))
				.toExist()
				.withTimeout(2000);
			await waitFor(element(by.id(`select-list-view-item-${toBeMoved}`)))
				.toExist()
				.withTimeout(2000);
			await element(by.id(`select-list-view-item-${toBeMoved}`)).tap();
			await waitFor(element(by.id('select-list-view-submit')))
				.toExist()
				.withTimeout(2000);
			await element(by.id('select-list-view-submit')).tap();
			await waitFor(element(by.label('You are converting this Team to a Channel')))
				.toExist()
				.withTimeout(2000);
			await element(by.text('Convert')).tap();
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
