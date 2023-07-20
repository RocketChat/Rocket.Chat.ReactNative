import { by, device, element, expect, waitFor } from 'detox';

import { TTextMatcher, login, navigateToLogin, platformTypes, searchRoom, tapBack, tryTapping } from '../../helpers/app';
import { ITestUser, createRandomRoom, createRandomUser, initApi } from '../../helpers/data_setup';
import random from '../../helpers/random';

const roomId = '64b846e4760e618aa9f91ab7';

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

export function waitForVisible(id: string) {
	return waitFor(element(by.id(id)))
		.toBeVisible()
		.withTimeout(5000);
}

export function waitForVisibleTextMatcher(msg: string, textMatcher: TTextMatcher) {
	return waitFor(element(by[textMatcher](msg)).atIndex(0))
		.toExist()
		.withTimeout(5000);
}

export function waitForNotVisible(id: string) {
	return waitFor(element(by.id(id)))
		.not.toBeVisible()
		.withTimeout(5000);
}

describe('Auto Translate', () => {
	let textMatcher: TTextMatcher;
	const defaultLanguage = 'en';
	const translatedLanguage = 'pt';

	const oldMessage = {
		pt: 'mensagem que não deveria ser traduzida',
		en: 'message that should not be translated'
	};

	const newMessage = {
		pt: 'gato',
		en: 'cat'
	};

	beforeAll(async () => {
		const user = await createRandomUser();
		await createRandomRoom(user);
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		({ textMatcher } = platformTypes[device.getPlatform()]);
		await navigateToLogin();
		await login(user.username, user.password);
	});

	describe('Channel/Group', () => {
		it('should join translation-test room', async () => {
			await navigateToRoom('translation-test');
			await element(by.id('room-view-join-button')).tap();
			await waitForNotVisible('room-view-join-button');
			await tapBack();
			await navigateToRoom('translation-test');
			await waitForVisible('messagebox');
			await expect(element(by.id('room-view-join'))).not.toBeVisible();
		});

		it('should see old message not translated before enable auto translate', async () => {
			await waitForVisibleTextMatcher(oldMessage[defaultLanguage], textMatcher);
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
			await waitFor(element(by.id(`auto-translate-view-${defaultLanguage}`)))
				.toBeVisible()
				.whileElement(by.id('auto-translate-view'))
				.scroll(500, 'down');
			await waitForVisible(`auto-translate-view-${defaultLanguage}-check`);

			// enable translated language
			await waitFor(element(by.id(`auto-translate-view-${translatedLanguage}`)))
				.toBeVisible()
				.whileElement(by.id('auto-translate-view'))
				.scroll(500, 'down');
			await waitForNotVisible(`auto-translate-view-${translatedLanguage}-check`);
			await element(by.id(`auto-translate-view-${translatedLanguage}`)).tap();
			await waitForVisible(`auto-translate-view-${translatedLanguage}-check`);

			// verify default language is unchecked
			await waitFor(element(by.id(`auto-translate-view-${defaultLanguage}`)))
				.toBeVisible()
				.whileElement(by.id('auto-translate-view'))
				.scroll(500, 'up');
			await waitForNotVisible(`auto-translate-view-${defaultLanguage}-check`);

			await tapBack();
			await tapBack();
		});

		it('should see old message translated after enable auto translate', async () => {
			await waitForVisibleTextMatcher(oldMessage[translatedLanguage], textMatcher);
		});

		it('should see new message translated', async () => {
			const randomMatcher = random();
			const data = await sendMessageOnTranslationTestRoom(`${newMessage[defaultLanguage]} - ${randomMatcher}`);
			await waitForVisibleTextMatcher(`${newMessage[translatedLanguage]} - ${randomMatcher}`, textMatcher);
			await deleteMessageOnTranslationTestRoom(data);
		});

		it('should see original message', async () => {
			const randomMatcher = random();
			const data = await sendMessageOnTranslationTestRoom(`${newMessage[defaultLanguage]} - ${randomMatcher}`);
			await waitForVisibleTextMatcher(`${newMessage[translatedLanguage]} - ${randomMatcher}`, textMatcher);

			await tryTapping(element(by[textMatcher](`${newMessage[translatedLanguage]} - ${randomMatcher}`)).atIndex(0), 2000, true);

			await waitForVisible('action-sheet-handle');
			await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);

			await waitForVisibleTextMatcher('View original', textMatcher);
			await element(by[textMatcher]('View original')).atIndex(0).tap();

			await waitForVisibleTextMatcher(`${newMessage[defaultLanguage]} - ${randomMatcher}`, textMatcher);

			await deleteMessageOnTranslationTestRoom(data);
		});

		it('disable auto translate and see original message', async () => {
			const randomMatcher = random();
			const data = await sendMessageOnTranslationTestRoom(`${newMessage[defaultLanguage]} - ${randomMatcher}`);

			await waitForVisibleTextMatcher(`${newMessage[translatedLanguage]} - ${randomMatcher}`, textMatcher);

			await element(by.id('room-header')).tap();
			await waitForVisible('room-actions-view');
			await element(by.id('room-actions-view')).swipe('up');

			await waitForVisible('room-actions-auto-translate');
			await element(by.id('room-actions-auto-translate')).tap();

			await waitForVisible('auto-translate-view-switch');
			await element(by.id('auto-translate-view-switch')).tap();

			await tapBack();
			await tapBack();

			await waitForVisibleTextMatcher(`${newMessage[defaultLanguage]} - ${randomMatcher}`, textMatcher);

			await deleteMessageOnTranslationTestRoom(data);
		});
	});
});
