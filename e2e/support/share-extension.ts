import { expect } from 'e2e';

import { groupMessageCount, type Credentials } from './api';
import type { Fixtures } from './flows';
import { firstVisible, LONG_TIMEOUT, succeeds, tapIfVisible, tapUntilVisible } from './flows';

const PHOTOS_APP = 'com.apple.mobileslideshow';
const ANDROID_FILES_APP = 'com.google.android.documentsui';
const SHARE_TARGET_ATTEMPTS = 3;
const SHARE_TARGET_RESPONSE_TIMEOUT = 15_000;
const SHORT_TIMEOUT = 15_000;

const PHOTO_SELECTED = '1 Photo Selected';
const PHOTOS_NOTIFICATIONS_PROMPT = '“Photos” Would Like to Send You Notifications';

const shareFromLibraryGrid = async ({ screen }: Fixtures) => {
	await screen.getByTestId('PXGGridLayout-Info').first().longPress();
	await tapIfVisible(screen.getByText('Share').first());
};

const PHOTO_SHARE_ATTEMPTS = 4;
const PHOTO_SHARE_RESPONSE_TIMEOUT = 5_000;

export const openPhotoShareSheet = async (fixtures: Fixtures) => {
	const { device, screen } = fixtures;
	const whatsNewContinue = screen.getByText('Continue', { visible: true }).first();
	const photoSelected = screen.getByText(PHOTO_SELECTED);
	const photoViewerShare = screen.getByTestId('PUOneUpBarButtonItemIdentifierShare');
	const library = screen.getByText('Library').first();
	const notificationsPrompt = screen.getByText(PHOTOS_NOTIFICATIONS_PROMPT).first();
	await device.openApp(PHOTOS_APP, { relaunch: true });
	for (let attempt = 1; attempt <= PHOTO_SHARE_ATTEMPTS; attempt += 1) {
		const photosState = await firstVisible(
			[photoSelected, notificationsPrompt, whatsNewContinue, photoViewerShare, library],
			SHORT_TIMEOUT
		);
		if (photosState === photoSelected) {
			return;
		}
		if (photosState === notificationsPrompt) {
			await device.alert('dismiss');
			continue;
		}
		if (photosState === whatsNewContinue) {
			await whatsNewContinue.tap();
		} else if (photosState === photoViewerShare) {
			await photoViewerShare.tap();
		} else {
			await shareFromLibraryGrid(fixtures);
		}
		if (await succeeds(expect(photoSelected).toBeVisible({ timeout: PHOTO_SHARE_RESPONSE_TIMEOUT }))) {
			return;
		}
	}
	await expect(photoSelected).toBeVisible({ timeout: SHORT_TIMEOUT });
};

export const shareToRocketChat = async ({ device, screen }: Fixtures, rocketChatApp: string) => {
	const shareCell = screen.getByTestId('shareCell').filter({ hasText: 'Rocket.Chat' });
	const shareList = screen.getByTestId('share-list-view');
	await screen.scrollUntilVisible(shareCell, { direction: 'right', timeout: SHORT_TIMEOUT });
	await shareCell.tap();
	if (!(await succeeds(expect(shareList).toBeVisible({ timeout: SHARE_TARGET_RESPONSE_TIMEOUT })))) {
		await device.openApp(rocketChatApp);
	}
	await expect(shareList).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const shareDownloadedFileToRocketChat = async (fixtures: Fixtures, fileName: string) => {
	const { device, screen } = fixtures;
	await device.openApp(ANDROID_FILES_APP, { relaunch: true });
	await expect(screen.getByText('Files in Downloads')).toBeVisible({ timeout: LONG_TIMEOUT });
	const downloadedFile = screen.getByText(fileName);
	await screen.scrollUntilVisible(downloadedFile, { timeout: LONG_TIMEOUT });
	await downloadedFile.longPress();
	await screen.getByLabel('Share').tap();
	const shareList = screen.getByTestId('share-list-view');
	for (let attempt = 1; attempt <= SHARE_TARGET_ATTEMPTS; attempt += 1) {
		await tapIfVisible(screen.getByText('Rocket.Chat', { visible: true }));
		if (await succeeds(expect(shareList).toBeVisible({ timeout: SHARE_TARGET_RESPONSE_TIMEOUT }))) {
			return;
		}
	}
	await expect(shareList).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const sendSharedFileToRoom = async (fixtures: Fixtures, room: string) => {
	const { screen } = fixtures;
	await expect(screen.getByText('Send to...')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId('share-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	const roomItem = screen.getByTestId(`share-extension-item-${room}`).first();
	await expect(roomItem).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapUntilVisible(fixtures, roomItem, 'share-view');
	await expect(screen.getByText(`Sending to ${room}`)).toBeVisible({ timeout: SHORT_TIMEOUT });
	await screen.getByTestId('message-composer-send').tap();
	await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const expectGroupMessageCount = async (credentials: Credentials, roomId: string, expectedCount: number) => {
	await expect.poll(() => groupMessageCount(credentials, roomId), { timeout: LONG_TIMEOUT }).toBe(expectedCount);
};
