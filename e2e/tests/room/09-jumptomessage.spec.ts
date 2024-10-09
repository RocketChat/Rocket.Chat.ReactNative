import { device, waitFor, element, by, expect } from 'detox';

import data from '../../data';
import {
	navigateToLogin,
	tapBack,
	login,
	sleep,
	platformTypes,
	TTextMatcher,
	navigateToRoom,
	jumpToQuotedMessage
} from '../../helpers/app';

let textMatcher: TTextMatcher;
let alertButtonType: string;

async function clearCache() {
	await waitFor(element(by.id('room-view')))
		.toBeVisible()
		.withTimeout(5000);
	await tapBack();
	await waitFor(element(by.id('rooms-list-view')))
		.toBeVisible()
		.withTimeout(10000);
	await element(by.id('rooms-list-view-sidebar')).tap();
	await sleep(300); // wait animation
	await waitFor(element(by.id('sidebar-settings')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('sidebar-settings')).tap();
	await sleep(300); // wait animation
	await waitFor(element(by.id('settings-view-clear-cache')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('settings-view-clear-cache')).tap();
	await waitFor(element(by[textMatcher]('This will clear all your offline data.')))
		.toExist()
		.withTimeout(2000);
	await element(by[textMatcher]('Clear').and(by.type(alertButtonType))).tap();
	await waitFor(element(by.id('rooms-list-view')))
		.toBeVisible()
		.withTimeout(5000);
	await waitFor(element(by.id('rooms-list-view-item-jumping')))
		.toExist()
		.withTimeout(10000);
}

async function waitForLoading() {
	// if (device.getPlatform() === 'android') {
	await sleep(10000);
	// 	return; // FIXME: Loading indicator doesn't animate properly on android
	// }
	// await waitFor(element(by.id('loading-image')))
	// 	.toBeVisible()
	// 	.withTimeout(5000);
	// await waitFor(element(by.id('loading-image')))
	// 	.toBeNotVisible()
	// 	.withTimeout(10000);
}

function getIndex() {
	if (device.getPlatform() === 'android') {
		return 1;
	}
	return 0;
}

describe('Room', () => {
	beforeAll(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ alertButtonType, textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(data.adminUser, data.adminPassword);
	});

	it('should jump to an old message and load its surroundings', async () => {
		if (device.getPlatform() === 'android') {
			return;
		}
		await navigateToRoom('jumping');
		await waitFor(element(by[textMatcher]('295')))
			.toExist()
			.withTimeout(5000);
		await sleep(2000);
		await jumpToQuotedMessage(element(by[textMatcher]('1')).atIndex(0));
		await waitForLoading();
		await waitFor(element(by[textMatcher]('1')).atIndex(0))
			.toExist()
			.withTimeout(30000);
		await expect(element(by[textMatcher]('2'))).toExist();
	});

	it('should tap FAB and scroll to bottom', async () => {
		if (device.getPlatform() === 'android') {
			return;
		}
		await waitFor(element(by.id('nav-jump-to-bottom')))
			.toExist()
			.withTimeout(15000);
		await element(by.id('nav-jump-to-bottom')).tap();
		await waitFor(element(by[textMatcher]("Go to jumping-thread's thread")))
			.toExist()
			.withTimeout(15000);
		await clearCache();
	});

	it('should load messages on scroll', async () => {
		if (device.getPlatform() === 'android') {
			return;
		}
		await navigateToRoom('jumping');
		await waitFor(element(by.id('room-view-messages')))
			.toExist()
			.withTimeout(5000);
		await waitFor(element(by[textMatcher]('300')))
			.toExist()
			.withTimeout(30000);
		let found = false;
		while (!found) {
			try {
				const direction = device.getPlatform() === 'android' ? 'down' : 'up';
				await element(by.id('room-view-messages')).scroll(500, direction);
				await expect(element(by[textMatcher]('249'))).toExist();
				found = true;
			} catch {
				//
			}
		}
		await clearCache();
	});

	it('should search for old message and load its surroundings', async () => {
		if (device.getPlatform() === 'android') {
			return;
		}
		await navigateToRoom('jumping');
		await sleep(1000); // wait for proper load the room
		await element(by.id('room-view-search')).tap();
		await waitFor(element(by.id('search-messages-view')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('search-message-view-input')).replaceText('30');
		await waitFor(element(by[textMatcher]('30')).atIndex(getIndex()))
			.toExist()
			.withTimeout(30000);
		await sleep(1000);
		await element(by[textMatcher]('30')).atIndex(getIndex()).tap();
		await waitForLoading();
		await waitFor(element(by[textMatcher]('30')).atIndex(0))
			.toExist()
			.withTimeout(30000);
		await expect(element(by[textMatcher]('31'))).toExist();
		await expect(element(by[textMatcher]('32'))).toExist();
	});

	it('should load newer and older messages', async () => {
		if (device.getPlatform() === 'android') {
			return;
		}
		let found = false;
		while (!found) {
			try {
				// it doesn't recognize this list
				await element(by.id('room-view-messages')).scroll(500, 'up');
				await expect(element(by[textMatcher]('Load older'))).toBeVisible();
				await expect(element(by[textMatcher]('5'))).toExist();
				found = true;
			} catch {
				//
			}
		}
		await element(by[textMatcher]('Load older')).atIndex(0).tap();
		await waitFor(element(by[textMatcher]('4')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('down', 'fast', 0.5);
		await waitFor(element(by[textMatcher]('1')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('up', 'fast', 0.5);
		await waitFor(element(by[textMatcher]('25')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('up', 'fast', 0.5);
		await waitFor(element(by[textMatcher]('50')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('room-view-messages')).atIndex(0).swipe('up', 'slow', 0.3);
		// 104
		await sleep(300);
		await waitFor(element(by[textMatcher]('Load newer')))
			.toExist()
			.withTimeout(5000);
		await element(by[textMatcher]('Load newer')).atIndex(0).tap();
		await waitFor(element(by[textMatcher]('104')))
			.toExist()
			.withTimeout(5000);
		// 154
		await sleep(300);
		await waitFor(element(by[textMatcher]('Load newer')))
			.toExist()
			.withTimeout(5000);
		await element(by[textMatcher]('Load newer')).atIndex(0).tap();
		await waitFor(element(by[textMatcher]('154')))
			.toExist()
			.withTimeout(5000);
		// 202
		await sleep(300);
		await waitFor(element(by[textMatcher]('Load newer')))
			.toExist()
			.withTimeout(5000);
		await element(by[textMatcher]('Load newer')).atIndex(0).tap();
		await waitFor(element(by[textMatcher]('202')))
			.toExist()
			.withTimeout(5000);

		// 253
		/**
		 * Sometimes CI loads messages differently than local.
		 * It loads up until 204 instead of 253.
		 */
		await sleep(300);
		try {
			await waitFor(element(by[textMatcher]('Load newer')))
				.toExist()
				.withTimeout(5000);
			await element(by[textMatcher]('Load newer')).atIndex(0).tap();
			await waitFor(element(by[textMatcher]('253')))
				.toExist()
				.withTimeout(5000);
		} catch (error) {
			await waitFor(element(by[textMatcher]('204')))
				.toExist()
				.withTimeout(5000);
		}

		await sleep(300);
		await waitFor(element(by[textMatcher]('Load newer')))
			.toNotExist()
			.withTimeout(5000);
		await expect(element(by[textMatcher]('Load more'))).toNotExist();
		await tapBack();
	});
});

const expectThreadMessages = async (message: string) => {
	await waitFor(element(by.id('room-view-title-thread 1')))
		.toExist()
		.withTimeout(10000);
	await waitFor(element(by[textMatcher](message)).atIndex(0))
		.toExist()
		.withTimeout(10000);
	await element(by[textMatcher](message)).atIndex(0).tap();
};

describe('Threads', () => {
	beforeAll(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true });
	});

	it('should navigate to a thread from another room', async () => {
		if (device.getPlatform() === 'android') {
			return;
		}
		await navigateToRoom('jumping');
		await waitFor(element(by[textMatcher]("Go to jumping-thread's thread")).atIndex(0))
			.toExist()
			.withTimeout(5000);
		await jumpToQuotedMessage(element(by[textMatcher]("Go to jumping-thread's thread")).atIndex(0));
		await expectThreadMessages("Go to jumping-thread's thread");
		await tapBack();
	});

	it('should tap on thread message from main room', async () => {
		if (device.getPlatform() === 'android') {
			return;
		}
		await waitFor(element(by.id('room-view-title-jumping-thread')))
			.toExist()
			.withTimeout(5000);
		await waitFor(element(by[textMatcher]('thread message sent to main room')))
			.toExist()
			.withTimeout(10000);
		await element(by[textMatcher]('thread message sent to main room')).atIndex(0).tap();
		await expectThreadMessages('thread message sent to main room');
		await tapBack();
	});

	it('should tap on quote', async () => {
		if (device.getPlatform() === 'android') {
			return;
		}
		await waitFor(element(by.id('room-view-title-jumping-thread')))
			.toExist()
			.withTimeout(5000);
		await waitFor(element(by[textMatcher]('quoted')))
			.toExist()
			.withTimeout(5000);
		await jumpToQuotedMessage(element(by[textMatcher]('quoted')).atIndex(0));
		await expectThreadMessages('quoted');
		await tapBack();
	});

	it('should jump from search message', async () => {
		if (device.getPlatform() === 'android') {
			return;
		}
		await waitFor(element(by.id('room-view-title-jumping-thread')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('room-view-search')).atIndex(0).tap();
		await waitFor(element(by.id('search-messages-view')))
			.toExist()
			.withTimeout(5000);
		await element(by.id('search-message-view-input')).replaceText('to be searched');
		await waitFor(element(by[textMatcher]('to be searched')).atIndex(getIndex()))
			.toExist()
			.withTimeout(30000);
		await element(by[textMatcher]('to be searched')).atIndex(getIndex()).tap();
		await expectThreadMessages('to be searched');
	});

	// TODO: Threads pagination
});
