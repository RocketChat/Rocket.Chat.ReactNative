const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { navigateToLogin, mockMessage, tapBack, login, sleep, searchRoom } = require('../../helpers/app');

async function navigateToRoom(roomName) {
	await searchRoom(`${ roomName }`);
	await element(by.id(`rooms-list-view-item-${ roomName }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
}

async function goCleanCache() {
	await tapBack();
	await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
	await element(by.id('sidebar-settings')).tap();
	await waitFor(element(by.id('settings-view'))).toBeVisible().withTimeout(2000);
	await element(by.id('settings-view-clear-cache')).tap();
	await waitFor(element(by.text('This will clear all your offline data.'))).toExist().withTimeout(2000);
	await element(by.label('Clear').and(by.type('_UIAlertControllerActionView'))).tap(); 
	await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(5000);
	await waitFor(element(by.id(`rooms-list-view-item-jumping`))).toExist().withTimeout(10000);
}

describe('Room', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(data.adminUser, data.adminPassword);
		await navigateToRoom('jumping');
	});

	it('should jump to an old message and load its surroundings', async() => {
		await waitFor(element(by.label('Quote first message'))).toExist().withTimeout(5000);
		await waitFor(element(by.label('300'))).toExist().withTimeout(5000);
		await waitFor(element(by.label('1')).atIndex(1)).toExist().withTimeout(5000);
		await element(by.label('1')).atIndex(1).tap();
		await waitFor(element(by.id('Loading'))).toBeNotVisible().withTimeout(5000);
		await waitFor(element(by.label('2'))).toExist().withTimeout(5000);
		await waitFor(element(by.label('3'))).toExist().withTimeout(5000);
		await sleep(3000);
	});

	it('should load messages on scroll', async() => {
		await goCleanCache();
		await navigateToRoom('jumping');
		await waitFor(element(by.id('room-view-messages'))).toExist().withTimeout(5000);
		await waitFor(element(by.label('300'))).toExist().withTimeout(5000);
		await waitFor(element(by.label('296'))).toExist().withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('down', 'fast', 0.8);
		await waitFor(element(by.label('275'))).toExist().withTimeout(5000);
	});

	it('should search for old message and load its surroundings', async() => {
		await element(by.id('room-view-search')).tap();
		await waitFor(element(by.id('search-messages-view'))).toExist().withTimeout(5000);
		await element(by.id('search-message-view-input')).typeText('30\n');
		await waitFor(element(by.label('30')).atIndex(1)).toExist().withTimeout(5000);
		await element(by.label('30')).atIndex(1).tap();
		await waitFor(element(by.label('30'))).toExist().withTimeout(6000);
		await waitFor(element(by.label('32'))).toExist().withTimeout(6000);
		await waitFor(element(by.label('31'))).toExist().withTimeout(6000);
		await waitFor(element(by.label('29'))).toExist().withTimeout(6000);
		await waitFor(element(by.label('28'))).toExist().withTimeout(6000);
	})

	it('should load newer and older messages', async() => {
		await sleep(3000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('down', 'fast', 0.8);
		await waitFor(element(by.label('5'))).toExist().withTimeout(5000);
		await waitFor(element(by.label('Load Older'))).toExist().withTimeout(5000);
		await element(by.label('Load Older')).atIndex(0).tap();
		await waitFor(element(by.label('4'))).toExist().withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('down', 'fast', 0.5);
		await waitFor(element(by.label('1'))).toExist().withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('up', 'fast', 0.5);
		await waitFor(element(by.label('25'))).toExist().withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('up', 'fast', 0.5);
		await waitFor(element(by.label('50'))).toExist().withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('up', 'slow', 0.5);
		await waitFor(element(by.label('Load Newer'))).toExist().withTimeout(5000);
		await element(by.label('Load Newer')).atIndex(0).tap();
		await waitFor(element(by.label('104'))).toExist().withTimeout(5000);
		await waitFor(element(by.label('Load Newer'))).toExist().withTimeout(5000);
		await element(by.label('Load Newer')).atIndex(0).tap();
		await waitFor(element(by.label('154'))).toExist().withTimeout(5000);
		await waitFor(element(by.label('Load Newer'))).toExist().withTimeout(5000);
		await element(by.label('Load Newer')).atIndex(0).tap();
		await waitFor(element(by.label('Load Newer'))).toNotExist().withTimeout(5000);
		await waitFor(element(by.label('Load More'))).toNotExist().withTimeout(5000);
	});
});

describe('Threads', async() => {
	it('should tap on thread on main channel and go to thread', async() => {
		await waitFor(element(by.id('nav-jump-to-bottom'))).toExist().withTimeout(5000);
		await element(by.id('nav-jump-to-bottom')).tap();
		await waitFor(element(by.label('1')).atIndex(0)).toExist().withTimeout(5000);
		await element(by.label('1')).atIndex(0).tap();
		await waitFor(element(by.label(`thread 1`))).toExist().withTimeout(5000);
	});

	it('should tap on thread message from main room', async() => {
		await tapBack();
		await waitFor(element(by.label('1')).atIndex(0)).toExist().withTimeout(5000);
		await element(by.label('1')).atIndex(0).tap();
		await waitFor(element(by.label(`thread 1`))).toExist().withTimeout(5000);
	});

	it('should tap on quote', async() => {
		await tapBack();
		await waitFor(element(by.label('Go to 1'))).toExist().gwithTimeout(5000);
		await element(by.label('1')).atIndex(1).tap();
		await waitFor(element(by.label(`thread 1`))).toExist().withTimeout(5000);
		
	});

	it('should jump from search message', async() => {
		await tapBack();
		await element(by.id('room-view-search')).tap();
		await waitFor(element(by.id('search-messages-view'))).toExist().withTimeout(5000);
		await element(by.id('search-message-view-input')).typeText('2\n');
		await sleep(1000);
		await waitFor(element(by.label('2')).atIndex(0)).toExist().withTimeout(10000);
		await waitFor(element(by.label(`thread 1`))).toExist().withTimeout(5000);
	});

	//TODO: Threads pagination
});