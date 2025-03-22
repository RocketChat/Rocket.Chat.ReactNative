import { by, device, element, expect, waitFor } from 'detox';

import { TTextMatcher, login, navigateToLogin, platformTypes, searchRoom, sleep, tapBack, tryTapping } from '../../helpers/app';
import { ITestUser, createRandomUser, initApi } from '../../helpers/data_setup';
import random from '../../helpers/random';

const roomId = '64b846e4760e618aa9f91ab7';

function getIndex() {
	if (device.getPlatform() === 'android') {
		return 1;
	}
	return 0;
}

const sendMessageOnTranslationTestRoom = async (msg: string): Promise<{ user: ITestUser; msgId: string }> => {
	const user = await createRandomUser();
	const api = await initApi(user.username, user.password);

	const msgId = random();

	await api.post('channels.join', { roomId, joinCode: null });
	await api.post('chat.sendMessage', {
		message: { _id: msgId, rid: roomId, msg, tshow: false }
	});

	return { user, msgId };
};

const deleteMessageOnTranslationTestRoom = async ({ user, msgId }: { user: ITestUser; msgId: string }): Promise<void> => {
	const api = await initApi(user.username, user.password);
	await api.post('chat.delete', {
		msgId,
		roomId
	});
};

async function navigateToRoom(roomName: string) {
	await searchRoom(`${roomName}`);
	await element(by.id(`rooms-list-view-item-${roomName}`)).tap();
	await waitFor(element(by.id('room-view')))
		.toBeVisible()
		.withTimeout(5000);
}

async function searchMessage(msg: string, textMatcher: TTextMatcher) {
	await sleep(1000); // wait for proper load the room
	await element(by.id('room-view-search')).tap();
	await waitFor(element(by.id('search-messages-view')))
		.toExist()
		.withTimeout(5000);
	await element(by.id('search-message-view-input')).replaceText(msg);
	await waitFor(element(by[textMatcher](msg)).atIndex(getIndex()))
		.toExist()
		.withTimeout(30000);
	await sleep(1000);
	await element(by[textMatcher](msg)).atIndex(getIndex()).tap();
	await sleep(10000);
}

function waitForVisible(id: string) {
	return waitFor(element(by.id(id)))
		.toBeVisible()
		.withTimeout(10000);
}

function waitForVisibleTextMatcher(msg: string, textMatcher: TTextMatcher) {
	return waitFor(element(by[textMatcher](msg)).atIndex(0))
		.toExist()
		.withTimeout(10000);
}

function waitForNotVisible(id: string) {
	return waitFor(element(by.id(id)))
		.not.toBeVisible()
		.withTimeout(10000);
}

// Skipped until we fix join code backend
describe.skip('Auto Translate', () => {
	let textMatcher: TTextMatcher;

	const languages = {
		default: 'en',
		translated: 'pt'
	};

	const oldMessage = {
		[languages.default]: 'dog',
		[languages.translated]: 'cachorro'
	};

	const newMessage = {
		[languages.default]: 'Cat',
		[languages.translated]: 'Gato'
	};

	const attachmentMessage = {
		[languages.default]: 'attachment',
		[languages.translated]: 'anexo'
	};

	beforeAll(async () => {
		const user = await createRandomUser();
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
	});

	it('should join translation-test room', async () => {
		await navigateToRoom('translation-test');
		await element(by.id('room-view-join-button')).tap();
		await waitForNotVisible('room-view-join-button');
		await tapBack();
		await navigateToRoom('translation-test');
		await waitForVisible('message-composer');
		await expect(element(by.id('room-view-join'))).not.toBeVisible();
	});

	it('should see old message not translated before enable auto translate', async () => {
		await searchMessage(oldMessage[languages.default] as string, textMatcher);
		await waitForVisibleTextMatcher(oldMessage[languages.default] as string, textMatcher);
		await waitForVisibleTextMatcher(attachmentMessage[languages.default] as string, textMatcher);
	});

	it('should enable auto translate', async () => {
		await element(by.id('room-header')).tap();

		await waitForVisible('room-actions-view');
		await element(by.id('room-actions-view')).swipe('up');

		await waitForVisible('room-actions-auto-translate');
		await element(by.id('room-actions-auto-translate')).tap();

		await waitForVisible('auto-translate-view-switch');
		await element(by.id('auto-translate-view-switch')).tap();

		// verify default language is checked
		await waitFor(element(by.id(`auto-translate-view-${languages.default}`)))
			.toExist()
			.whileElement(by.id('auto-translate-view'))
			.scroll(750, 'down');
		await element(by.id('auto-translate-view')).swipe('up', 'slow', 0.5);
		await waitForVisible(`auto-translate-view-${languages.default}-check`);

		// enable translated language
		await waitFor(element(by.id(`auto-translate-view-${languages.translated}`)))
			.toBeVisible()
			.whileElement(by.id('auto-translate-view'))
			.scroll(750, 'down');
		await waitForNotVisible(`auto-translate-view-${languages.translated}-check`);
		await element(by.id(`auto-translate-view-${languages.translated}`)).tap();
		await waitForVisible(`auto-translate-view-${languages.translated}-check`);

		// verify default language is unchecked
		await waitFor(element(by.id(`auto-translate-view-${languages.default}`)))
			.toBeVisible()
			.whileElement(by.id('auto-translate-view'))
			.scroll(750, 'up');
		await waitForNotVisible(`auto-translate-view-${languages.default}-check`);

		await tapBack();
		await tapBack();
	});

	it('should see old message translated after enable auto translate', async () => {
		await searchMessage(oldMessage[languages.default] as string, textMatcher);
		await waitForVisibleTextMatcher(oldMessage[languages.translated] as string, textMatcher);
		await waitForVisibleTextMatcher(attachmentMessage[languages.translated] as string, textMatcher);
	});

	it('should see new message translated', async () => {
		const randomMatcher = random();
		const data = await sendMessageOnTranslationTestRoom(`${newMessage[languages.default]}. Rc${randomMatcher}`);
		await searchMessage(`${newMessage[languages.default]}. Rc${randomMatcher}`, textMatcher); // will scroll the messages list to the last one
		await waitForVisibleTextMatcher(`${newMessage[languages.translated]}. Rc${randomMatcher}`, textMatcher);
		await deleteMessageOnTranslationTestRoom(data);
	});

	it('should see original message', async () => {
		const randomMatcher = random();
		const data = await sendMessageOnTranslationTestRoom(`${newMessage[languages.default]}. Rc${randomMatcher}`);
		await waitForVisibleTextMatcher(`${newMessage[languages.translated]}. Rc${randomMatcher}`, textMatcher);

		await tryTapping(element(by[textMatcher](`${newMessage[languages.translated]}. Rc${randomMatcher}`)).atIndex(0), 2000, true);

		await waitForVisible('action-sheet-handle');
		await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
		await element(by[textMatcher]('Get link')).atIndex(0).swipe('up', 'fast', 0.5);

		await waitForVisibleTextMatcher('View original', textMatcher);
		await element(by[textMatcher]('View original')).atIndex(0).tap();

		await waitForVisibleTextMatcher(`${newMessage[languages.default]}. Rc${randomMatcher}`, textMatcher);

		await deleteMessageOnTranslationTestRoom(data);
	});

	it('disable auto translate and see original message', async () => {
		const randomMatcher = random();
		const data = await sendMessageOnTranslationTestRoom(`${newMessage[languages.default]}. Rc${randomMatcher}`);

		await waitForVisibleTextMatcher(`${newMessage[languages.translated]}. Rc${randomMatcher}`, textMatcher);

		await element(by.id('room-header')).tap();
		await waitForVisible('room-actions-view');
		await element(by.id('room-actions-view')).swipe('up');

		await waitForVisible('room-actions-auto-translate');
		await element(by.id('room-actions-auto-translate')).tap();

		await waitForVisible('auto-translate-view-switch');
		await element(by.id('auto-translate-view-switch')).tap();

		await tapBack();
		await tapBack();

		await waitForVisibleTextMatcher(`${newMessage[languages.default]}. Rc${randomMatcher}`, textMatcher);

		await deleteMessageOnTranslationTestRoom(data);
	});

	it(`should don't see action to View original when disable auto translate`, async () => {
		await searchMessage(oldMessage[languages.default] as string, textMatcher); // will scroll the messages list to the last one
		await waitForVisibleTextMatcher(oldMessage[languages.default] as string, textMatcher);
		await tryTapping(element(by[textMatcher](oldMessage[languages.default] as string)).atIndex(0), 2000, true);

		await waitForVisible('action-sheet-handle');
		await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);

		await waitForNotVisible('View original');
		// close action sheet
		await element(by.id('room-header')).tap();
	});

	it('should the language selected when activating auto translate again must be the old one', async () => {
		await element(by.id('room-header')).tap();
		await waitForVisible('room-actions-view');
		await element(by.id('room-actions-view')).swipe('up');

		await waitForVisible('room-actions-auto-translate');
		await element(by.id('room-actions-auto-translate')).tap();

		await waitForVisible('auto-translate-view-switch');
		await element(by.id('auto-translate-view-switch')).tap();

		// verify translated language is checked and is the old one
		await waitFor(element(by.id(`auto-translate-view-${languages.translated}`)))
			.toBeVisible()
			.whileElement(by.id('auto-translate-view'))
			.scroll(750, 'down');
		await waitForVisible(`auto-translate-view-${languages.translated}-check`);
	});
});
