const data = require('../../data');
const { navigateToLogin, tapBack, login, searchRoom, sleep, platformTypes } = require('../../helpers/app');

async function navigateToRoom(roomName) {
	await searchRoom(`${roomName}`);
	await element(by.id(`rooms-list-view-item-${roomName}`)).tap();
	await waitFor(element(by.id('room-view')))
		.toBeVisible()
		.withTimeout(5000);
}

async function clearCache() {
	const { alertButtonType } = platformTypes[device.getPlatform()];
	await waitFor(element(by.id('room-view')))
		.toBeVisible()
		.withTimeout(5000);
	await tapBack();
	await waitFor(element(by.id('rooms-list-view')))
		.toBeVisible()
		.withTimeout(10000);
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-view')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('sidebar-settings')).tap();
	await waitFor(element(by.id('settings-view')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('settings-view-clear-cache')).tap();
	await waitFor(element(by.text('This will clear all your offline data.')))
		.toExist()
		.withTimeout(2000);
	await element(by.text('Clear').and(by.type(alertButtonType))).tap();
	await waitFor(element(by.id('rooms-list-view')))
		.toBeVisible()
		.withTimeout(5000);
	await waitFor(element(by.id('rooms-list-view-item-jumping')))
		.toExist()
		.withTimeout(10000);
}

async function waitForLoading() {
	if (device.getPlatform() === 'android') {
		await sleep(10000);
		return; // FIXME: Loading indicator doesn't animate properly on android
	}
	await waitFor(element(by.id('loading')))
		.toBeVisible()
		.withTimeout(5000);
	await waitFor(element(by.id('loading')))
		.toBeNotVisible()
		.withTimeout(10000);
}

describe('Room', () => {
	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.adminUser, data.adminPassword);
	});

	it('should jump to an old message and load its surroundings', async () => {
		if (device.getPlatform() === 'android') {
			return; // 'Room' tests don't work well on Android currently
		}
		await navigateToRoom('jumping');
		await waitFor(element(by.text('Quote first message')))
			.toExist()
			.withTimeout(5000);
		await element(by.text('1')).atIndex(0).tap();
		await waitForLoading();
		await waitFor(element(by.text('1')).atIndex(0))
			.toExist()
			.withTimeout(10000);
		await expect(element(by.text('2'))).toExist();
	});

	it('should tap FAB and scroll to bottom', async () => {
		if (device.getPlatform() === 'android') {
			return; // 'Room' tests don't work well on Android currently
		}
		await waitFor(element(by.id('nav-jump-to-bottom')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('nav-jump-to-bottom')).tap();
		await waitFor(element(by.text('Quote first message')))
			.toExist()
			.withTimeout(5000);
		await clearCache();
	});

	it('should load messages on scroll', async () => {
		if (device.getPlatform() === 'android') {
			return; // 'Room' tests don't work well on Android currently
		}
		await navigateToRoom('jumping');
		await waitFor(element(by.id('room-view-messages')))
			.toExist()
			.withTimeout(5000);
		await waitFor(element(by.text('300')))
			.toExist()
			.withTimeout(5000);
		let found = false;
		while (!found) {
			await element(by.id('room-view-messages')).atIndex(0).scroll(500, 'down');
			try {
				await expect(element(by.text('249'))).toExist();
				found = true;
			} catch {
				//
			}
		}
		await clearCache();
	});

	it('should search for old message and load its surroundings', async () => {
		if (device.getPlatform() === 'android') {
			return; // 'Room' tests don't work well on Android currently
		}
		await navigateToRoom('jumping');
		await element(by.id('room-view-search')).tap();
		await waitFor(element(by.id('search-messages-view')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('search-message-view-input')).typeText('30\n');
		await waitFor(element(by.text('30')).atIndex(0))
			.toExist()
			.withTimeout(5000);
		await element(by.text('30')).atIndex(0).tap();
		await waitForLoading();
		await expect(element(by.text('30'))).toExist();
		await expect(element(by.text('31'))).toExist();
		await expect(element(by.text('32'))).toExist();
		await waitFor(element(by.text('32')))
			.toBeVisible()
			.withTimeout(5000);
	});

	it('should load newer and older messages', async () => {
		await element(by.id('room-view-messages')).atIndex(0).swipe('down', 'fast', 0.8);
		await waitFor(element(by.text('5')))
			.toExist()
			.withTimeout(10000);
		await waitFor(element(by.label('Load Older')))
			.toExist()
			.withTimeout(5000);
		await element(by.label('Load Older')).atIndex(0).tap();
		await waitFor(element(by.text('4')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('down', 'fast', 0.5);
		await waitFor(element(by.text('1')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('up', 'fast', 0.5);
		await waitFor(element(by.text('25')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('up', 'fast', 0.5);
		await waitFor(element(by.text('50')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('up', 'slow', 0.5);
		await waitFor(element(by.label('Load Newer')))
			.toExist()
			.withTimeout(5000);
		await element(by.label('Load Newer')).atIndex(0).tap();
		await waitFor(element(by.text('104')))
			.toExist()
			.withTimeout(5000);
		await waitFor(element(by.label('Load Newer')))
			.toExist()
			.withTimeout(5000);
		await element(by.label('Load Newer')).atIndex(0).tap();
		await waitFor(element(by.text('154')))
			.toExist()
			.withTimeout(5000);
		await waitFor(element(by.label('Load Newer')))
			.toExist()
			.withTimeout(5000);
		await element(by.label('Load Newer')).atIndex(0).tap();
		await waitFor(element(by.label('Load Newer')))
			.toNotExist()
			.withTimeout(5000);
		await expect(element(by.label('Load More'))).toNotExist();
		await expect(element(by.text('201'))).toExist();
		await expect(element(by.text('202'))).toExist();
		await tapBack();
	});
});

const expectThreadMessages = async message => {
	await waitFor(element(by.id('room-view-title-jumping-thread')))
		.toExist()
		.withTimeout(5000);
	await expect(element(by.text(message))).toExist();
};

describe('Threads', () => {
	it('should navigate to a thread from another room', async () => {
		await navigateToRoom('jumping');
		await waitFor(element(by.text("Go to jumping-thread's thread")).atIndex(0))
			.toExist()
			.withTimeout(5000);
		await element(by.text("Go to jumping-thread's thread")).atIndex(0).tap();
		await waitForLoading();
		await expectThreadMessages("Go to jumping-thread's thread");
		await tapBack();
	});

	it('should tap on thread message from main room', async () => {
		await waitFor(element(by.text('thread message sent to main room')).atIndex(0))
			.toExist()
			.withTimeout(5000);
		await element(by.text('thread message sent to main room')).atIndex(0).tap();
		await expectThreadMessages('thread message sent to main room');
		await tapBack();
	});

	it('should tap on quote', async () => {
		await waitFor(element(by.text('quoted')))
			.toExist()
			.withTimeout(5000);
		await element(by.text('quoted')).atIndex(0).tap();
		await expectThreadMessages('quoted');
		await tapBack();
	});

	it('should jump from search message', async () => {
		await waitFor(element(by.id('room-view-title-jumping-thread')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('room-view-search')).atIndex(0).tap();
		await waitFor(element(by.id('search-messages-view')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('search-message-view-input')).typeText('to be searched\n');
		await waitFor(element(by.text('to be searched')))
			.toExist()
			.withTimeout(5000);
		await element(by.text('to be searched')).atIndex(1).tap();
		await expectThreadMessages('to be searched');
	});

	// TODO: Threads pagination
});
