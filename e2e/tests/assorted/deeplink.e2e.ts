import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers, getDeepLink, login, sendMessage } from '~e2e/support/api';
import { data } from '~e2e/support/data';
import {
	backToRoomsList,
	expectVisible,
	isVisibleNow,
	launchApp,
	navigateToRegister,
	navigateToRoom,
	openDeepLink,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenVisible
} from '~e2e/support/flows';
import { registerAccount } from '~e2e/support/onboarding';
import { random } from '~e2e/support/random';
import { delay } from '~e2e/support/timing';
import { checkServer, expectConnectedTo, relaunchApp, selectServer } from '~e2e/support/servers';

afterEach(deleteCreatedUsers);

const ROOMS_LIST_SETTLE_MS = 10_000;

const coldStartLink = async (fixtures: Fixtures, link: string) => {
	await fixtures.device.closeApp();
	await openDeepLink(fixtures, link);
};

const expectRoomTitle = ({ screen }: Fixtures, title: string) =>
	expect(screen.getByTestId(`room-view-title-${title}`)).toBeVisible({ timeout: LONG_TIMEOUT });

const sendAppToBackground = async (fixtures: Fixtures) => {
	const { device, platform } = fixtures;
	await expectConnectedTo(fixtures, data.server);
	await delay(ROOMS_LIST_SETTLE_MS);
	const foregroundBeforeHome = await device.foregroundApp();
	await device.home();
	if (platform === 'android') {
		await expect
			.poll(async () => (await device.foregroundApp()).bundleId, { timeout: LONG_TIMEOUT })
			.not.toBe(foregroundBeforeHome.bundleId);
	}
};

const shareTextTo = async (fixtures: Fixtures, room: string, message: string) => {
	await tapWhenVisible(fixtures, `share-extension-item-${room}`);
	await expectVisible(fixtures, 'share-view');
	await expect(fixtures.screen.getByText('Send')).toBeVisible({ timeout: LONG_TIMEOUT });
	await fixtures.screen.getByText('Send').tap();
	await navigateToRoom(fixtures, room);
	await expectVisible(fixtures, `message-content-${message}`);
};

const expectRoomTitleToleratingSnapshotFailures = async ({ screen }: Fixtures, title: string) => {
	const roomTitle = screen.getByTestId(`room-view-title-${title}`);
	await expect.poll(() => isVisibleNow(roomTitle), { timeout: LONG_TIMEOUT }).toBe(true);
};

const answerLoginPrompt = async (fixtures: Fixtures, link: string, answer: RegExp) => {
	const { screen } = fixtures;
	await launchApp(fixtures);
	await coldStartLink(fixtures, link);
	await expect(screen.getByText(/Sign in to this workspace/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByText(/A link is asking to sign you in/)).toBeVisible();
	await screen.getByRole('button', { name: answer }).last().tap();
};

const createDeepLinkTargets = async () => {
	const user = await createUser();
	const session = await login(user);
	const room = await createRandomRoom(user, 'p');
	const threadMessage = `to-thread-${random()}`;
	const thread = await sendMessage(user, room.name, threadMessage);
	await sendMessage(user, thread.message.rid, 'insidethread', thread.message._id);

	const roomPath = `group/${room.name}`;
	const authLink = (extra: Record<string, string> = {}) =>
		getDeepLink('auth', data.server, { userId: session.userId, token: session.authToken, path: roomPath, ...extra });
	const roomLink = getDeepLink('room', data.server, { path: roomPath });
	return { room, roomPath, threadMessage, thread, authLink, roomLink };
};

const shareLink = (text: string) => `rocketchat://shareextension?text=${text}`;

test('handles auth deep links', { tags: ['test-4'] }, async fixtures => {
	const { screen } = fixtures;
	const { room, authLink } = await createDeepLinkTargets();
	const roomItem = screen.getByTestId(`rooms-list-view-item-${room.name}`);

	await launchApp(fixtures);
	await coldStartLink(fixtures, getDeepLink('auth', data.server, { userId: '123', token: 'abc' }));
	await expectVisible(fixtures, 'workspace-view');

	await launchApp(fixtures);
	await coldStartLink(fixtures, authLink());
	await expectRoomTitle(fixtures, room.name);
	await backToRoomsList(fixtures);
	await checkServer(fixtures, data.server);
	await expect(roomItem).toBeVisible({ timeout: LONG_TIMEOUT });
});

test('handles room, thread and share deep links with two workspaces', { tags: ['test-7'], timeout: 900_000 }, async fixtures => {
	const { screen } = fixtures;
	const { room, roomPath, threadMessage, thread, authLink, roomLink } = await createDeepLinkTargets();
	const roomItem = screen.getByTestId(`rooms-list-view-item-${room.name}`);

	await launchApp(fixtures);
	await navigateToRegister(fixtures, data.alternateServer);
	await registerAccount(fixtures);

	await coldStartLink(fixtures, authLink());
	await expectRoomTitle(fixtures, room.name);
	await backToRoomsList(fixtures);
	await checkServer(fixtures, data.server);
	await expect(roomItem).toBeVisible({ timeout: LONG_TIMEOUT });

	await coldStartLink(fixtures, roomLink);
	await expectRoomTitle(fixtures, room.name);

	await coldStartLink(fixtures, getDeepLink('room', data.server, { path: `${roomPath}/thread/${thread.message._id}` }));
	await expectRoomTitle(fixtures, threadMessage);

	await coldStartLink(fixtures, getDeepLink('room', data.server, { rid: room._id }));
	await expectRoomTitle(fixtures, room.name);
	await backToRoomsList(fixtures);

	await sendAppToBackground(fixtures);
	await openDeepLink(fixtures, roomLink, screen.getByTestId(`room-view-title-${room.name}`));
	await expectRoomTitle(fixtures, room.name);

	await relaunchApp(fixtures, data.server);
	await selectServer(fixtures, data.alternateServer);
	await checkServer(fixtures, data.alternateServer);
	await coldStartLink(fixtures, roomLink);
	await expectRoomTitle(fixtures, room.name);

	await coldStartLink(fixtures, getDeepLink('room', 'https://google.com', {}));
	await expectVisible(fixtures, 'rooms-list-view');

	const firstShare = random();
	await coldStartLink(fixtures, shareLink(firstShare));
	await expectVisible(fixtures, 'share-list-view');
	await shareTextTo(fixtures, room.name, firstShare);

	const secondShare = random();
	await backToRoomsList(fixtures);
	await selectServer(fixtures, data.alternateServer);
	await checkServer(fixtures, data.alternateServer);
	await coldStartLink(fixtures, shareLink(secondShare));
	await expectVisible(fixtures, 'share-list-view');
	await tapWhenVisible(fixtures, `server-item-${data.alternateServer}`);
	await expectVisible(fixtures, 'select-server-view');
	await screen.getByTestId(`server-item-${data.server}`).tap();
	await expectVisible(fixtures, 'share-list-view');
	await expectVisible(fixtures, `server-item-${data.server}`);
	await shareTextTo(fixtures, room.name, secondShare);
});

test('handles share and login prompt deep links without a workspace', { tags: ['test-4'] }, async fixtures => {
	const { screen } = fixtures;
	const { room, authLink } = await createDeepLinkTargets();

	await launchApp(fixtures);
	await coldStartLink(fixtures, shareLink('whatever'));
	await expectVisible(fixtures, 'new-server-view');

	await answerLoginPrompt(fixtures, authLink({ forceLoginPrompt: 'true' }), /^Cancel$/i);
	await expectVisible(fixtures, 'new-server-view');
	await expect(screen.getByTestId(`room-view-title-${room.name}`)).toBeHidden();

	await answerLoginPrompt(fixtures, authLink({ forceLoginPrompt: 'true' }), /^Login$/i);
	await expectRoomTitleToleratingSnapshotFailures(fixtures, room.name);
	await backToRoomsList(fixtures);
});
