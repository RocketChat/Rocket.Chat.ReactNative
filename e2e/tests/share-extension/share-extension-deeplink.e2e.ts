import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import { loginWithDeepLink, openDeepLink, LONG_TIMEOUT } from '~e2e/support/flows';
import {
	expectGroupMessageCount,
	openPhotoShareSheet,
	sendSharedFileToRoom,
	shareDownloadedFileToRocketChat,
	shareToRocketChat
} from '~e2e/support/share-extension';

const MISSING_FILE_LINK = 'rocketchat://shareextension?mediaUris=file:///nonexistent.jpg';

const ANDROID_SHARED_FILES = [
	'image.png',
	'test.mp4',
	'test.mp3',
	'test.ogg',
	'test.wav',
	'test.docx',
	'test.zip',
	'test.txt',
	'test.html',
	'test.pdf',
	'test.heic',
	'test.mov',
	'test.m4a'
];

afterEach(deleteCreatedUsers);

test('shares files into a room and handles a missing shared file', { tags: ['test-9'], timeout: 900_000 }, async fixtures => {
	const { screen, platform, device } = fixtures;
	test.skip(platform === 'android', 'Android drops the second share until the url listener registers without a delay');
	const user = await createUser();
	const room = await createRandomRoom(user, 'p');

	await loginWithDeepLink(fixtures, user);
	const rocketChatApp = await device.foregroundApp();
	await device.closeApp();

	if (platform === 'ios') {
		await openPhotoShareSheet(fixtures);
		await shareToRocketChat(fixtures, rocketChatApp.bundleId ?? rocketChatApp.name);
		await sendSharedFileToRoom(fixtures, room.name);
		await expectGroupMessageCount(user, room._id, 1);
	}

	if (platform === 'android') {
		for (const [index, fileName] of ANDROID_SHARED_FILES.entries()) {
			await shareDownloadedFileToRocketChat(fixtures, fileName);
			await sendSharedFileToRoom(fixtures, room.name);
			await expectGroupMessageCount(user, room._id, index + 1);
		}
	}

	const missingFileToast = screen.getByText('The shared file could not be found');
	await openDeepLink(fixtures, MISSING_FILE_LINK, missingFileToast);
	await expect(missingFileToast).toBeVisible({ timeout: 15_000 });
	await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
});
