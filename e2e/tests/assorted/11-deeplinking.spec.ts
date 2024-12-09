import { device, waitFor, element, by } from 'detox';
import EJSON from 'ejson';

import data from '../../data';
import {
	tapBack,
	checkServer,
	navigateToRegister,
	expectValidRegisterOrRetry,
	navigateToRoom,
	checkMessage,
	sleep
} from '../../helpers/app';
import {
	IDeleteCreateUser,
	createRandomRoom,
	createRandomUser,
	deleteCreatedUsers,
	login,
	sendMessage
} from '../../helpers/data_setup';
import random from '../../helpers/random';

const DEEPLINK_METHODS = { AUTH: 'auth', ROOM: 'room' };

const amp = '&';

const getDeepLink = (method: string, server: string, params?: string) => {
	const deeplink = `rocketchat://${method}?host=${server.replace(/^(http:\/\/|https:\/\/)/, '')}${amp}${params}`;
	console.log(`Deeplinking to: ${deeplink}`);
	return deeplink;
};

describe('Deep linking', () => {
	let userId: string;
	let authToken: string;
	let threadId: string;
	let rid: string;
	let room: string;
	const threadMessage = `to-thread-${random()}`;

	const deleteUsersAfterAll: IDeleteCreateUser[] = [];

	beforeAll(async () => {
		const user = await createRandomUser();
		({ _id: rid, name: room } = await createRandomRoom(user, 'p'));
		const loginResult = await login(user.username, user.password);
		({ userId, authToken } = loginResult);
		// create a thread with api
		const result = await sendMessage(user, room, threadMessage);
		threadId = result.message._id;
		await sendMessage(user, result.message.rid, random(), threadId);
	});

	afterAll(async () => {
		await deleteCreatedUsers(deleteUsersAfterAll);
	});

	const authAndNavigate = async () => {
		await device.launchApp({
			permissions: { notifications: 'YES' },
			newInstance: true,
			url: getDeepLink(DEEPLINK_METHODS.AUTH, data.server, `userId=${userId}${amp}token=${authToken}${amp}path=group/${room}`)
		});
		await waitFor(element(by.id(`room-view-title-${room}`)))
			.toExist()
			.withTimeout(30000);
		await tapBack();
		await waitFor(element(by.id('rooms-list-view')))
			.toBeVisible()
			.withTimeout(10000);
		await checkServer(data.server);
		await waitFor(element(by.id(`rooms-list-view-item-${room}`)))
			.toExist()
			.withTimeout(2000);
	};

	describe('Authentication', () => {
		it('should run a deep link to an invalid account and raise error', async () => {
			await device.launchApp({
				permissions: { notifications: 'YES' },
				delete: true,
				url: getDeepLink(DEEPLINK_METHODS.AUTH, data.server, `userId=123${amp}token=abc`)
			});
			await waitFor(element(by.id('workspace-view')))
				.toBeVisible()
				.withTimeout(30000);
			// await waitFor(element(by[textMatcher]("You've been logged out by the workspace. Please log in again.")))
			// 	.toExist()
			// 	.withTimeout(30000); // TODO: we need to improve this message
		});

		it('should authenticate and navigate', async () => {
			await authAndNavigate();
		});

		it('should authenticate while logged in another server', async () => {
			await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
			await navigateToRegister(data.alternateServer);
			const randomUser = data.randomUser();
			await element(by.id('register-view-name')).replaceText(randomUser.name);
			await element(by.id('register-view-name')).tapReturnKey();
			await element(by.id('register-view-username')).replaceText(randomUser.username);
			await element(by.id('register-view-username')).tapReturnKey();
			await element(by.id('register-view-email')).replaceText(randomUser.email);
			await element(by.id('register-view-email')).tapReturnKey();
			await element(by.id('register-view-password')).replaceText(randomUser.password);
			await element(by.id('register-view-password')).tapReturnKey();
			await expectValidRegisterOrRetry(device.getPlatform());
			deleteUsersAfterAll.push({ server: data.alternateServer, username: randomUser.username });

			await authAndNavigate();
		});
	});

	describe('Room', () => {
		describe('While logged in', () => {
			it('should navigate to the room using path', async () => {
				await device.launchApp({
					permissions: { notifications: 'YES' },
					newInstance: true,
					url: getDeepLink(DEEPLINK_METHODS.ROOM, data.server, `path=group/${room}`)
				});
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toExist()
					.withTimeout(30000);
			});

			it('should navigate to the thread using path', async () => {
				await device.launchApp({
					permissions: { notifications: 'YES' },
					newInstance: true,
					url: getDeepLink(DEEPLINK_METHODS.ROOM, data.server, `path=group/${room}/thread/${threadId}`)
				});
				await waitFor(element(by.id(`room-view-title-${threadMessage}`)))
					.toExist()
					.withTimeout(30000);
			});

			it('should navigate to the room using rid', async () => {
				await device.launchApp({
					permissions: { notifications: 'YES' },
					newInstance: true,
					url: getDeepLink(DEEPLINK_METHODS.ROOM, data.server, `rid=${rid}`)
				});
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toExist()
					.withTimeout(30000);
				await tapBack();
				await waitFor(element(by.id('rooms-list-view')))
					.toBeVisible()
					.withTimeout(2000);
			});

			it('should resume from background and navigate to the room', async () => {
				if (device.getPlatform() === 'android') {
					console.log('Skipped on Android');
					return;
				}
				await device.sendToHome();
				await device.launchApp({
					permissions: { notifications: 'YES' },
					newInstance: false,
					url: getDeepLink(DEEPLINK_METHODS.ROOM, data.server, `path=group/${room}`)
				});
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toExist()
					.withTimeout(30000);
				await tapBack();
				await waitFor(element(by.id('rooms-list-view')))
					.toBeVisible()
					.withTimeout(2000);
			});

			it('should simulate a tap on a push notification and navigate to the room', async () => {
				if (device.getPlatform() === 'android') {
					console.log('Skipped on Android');
					return;
				}
				/**
				 * Ideally, we would repeat this test to simulate a resume from background,
				 * but for some reason it was not working as expected
				 * This was always turning to false right before running the logic https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/18f359a8ef9691144970c0c1fad990f82096b024/app/lib/notifications/push.ts#L58
				 */
				// await device.sendToHome();
				await device.launchApp({
					newInstance: true,
					userNotification: {
						trigger: {
							type: 'push'
						},
						title: 'From push',
						body: 'Body',
						badge: 1,
						payload: {
							ejson: EJSON.stringify({
								rid: null,
								host: data.server,
								name: room,
								type: 'p'
							})
						}
					}
				});
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toExist()
					.withTimeout(30000);
				await tapBack();
				await waitFor(element(by.id('rooms-list-view')))
					.toBeVisible()
					.withTimeout(2000);
			});
		});

		describe('Others', () => {
			it('should change server', async () => {
				await waitFor(element(by.id('rooms-list-view')))
					.toBeVisible()
					.withTimeout(2000);
				await element(by.id('rooms-list-header-servers-list-button')).tap();
				await waitFor(element(by.id('rooms-list-header-servers-list')))
					.toBeVisible()
					.withTimeout(5000);
				await element(by.id(`server-item-${data.alternateServer}`)).tap();
				await checkServer(data.alternateServer);

				await device.launchApp({
					permissions: { notifications: 'YES' },
					newInstance: true,
					url: getDeepLink(DEEPLINK_METHODS.ROOM, data.server, `path=group/${room}`)
				});
				await waitFor(element(by.id(`room-view-title-${room}`)))
					.toExist()
					.withTimeout(30000);
			});

			it('should add a not existing server and fallback to the previous one', async () => {
				await device.launchApp({
					permissions: { notifications: 'YES' },
					newInstance: true,
					url: getDeepLink(DEEPLINK_METHODS.ROOM, 'https://google.com')
				});
				await waitFor(element(by.id('rooms-list-view')))
					.toBeVisible()
					.withTimeout(30000);
				await checkServer(data.server);
			});
		});
	});

	describe('Share extension', () => {
		const shareTextMessage = async (message: string) => {
			await waitFor(element(by.id(`share-extension-item-${room}`)))
				.toBeVisible()
				.withTimeout(30000);
			await element(by.id(`share-extension-item-${room}`)).tap();
			await waitFor(element(by.id('share-view')))
				.toBeVisible()
				.withTimeout(30000);
			await waitFor(element(by.text('Send')))
				.toBeVisible()
				.withTimeout(30000);
			await element(by.text('Send')).tap();
			await navigateToRoom(room);
			await checkMessage(message);
		};

		it('should share text', async () => {
			const message = random();
			await device.launchApp({
				permissions: { notifications: 'YES' },
				newInstance: true,
				url: `rocketchat://shareextension?text=${message}`
			});
			await waitFor(element(by.id('share-list-view')))
				.toBeVisible()
				.withTimeout(30000);
			await shareTextMessage(message);
		});

		it('should change server and share text', async () => {
			await tapBack();
			await waitFor(element(by.id('rooms-list-view')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('rooms-list-header-servers-list-button')).tap();
			await waitFor(element(by.id('rooms-list-header-servers-list')))
				.toBeVisible()
				.withTimeout(5000);
			await element(by.id(`server-item-${data.alternateServer}`)).tap();
			await checkServer(data.alternateServer);

			// share
			const message = random();
			await device.launchApp({
				permissions: { notifications: 'YES' },
				newInstance: true,
				url: `rocketchat://shareextension?text=${message}`
			});
			await waitFor(element(by.id('share-list-view')))
				.toBeVisible()
				.withTimeout(30000);
			await sleep(300);
			await waitFor(element(by.id(`server-item-${data.alternateServer}`)))
				.toBeVisible()
				.withTimeout(2000);
			await element(by.id(`server-item-${data.alternateServer}`)).tap();
			await waitFor(element(by.id('select-server-view')))
				.toBeVisible()
				.withTimeout(30000);
			await element(by.id(`server-item-${data.server}`)).tap();
			await waitFor(element(by.id('share-list-view')))
				.toBeVisible()
				.withTimeout(30000);
			await waitFor(element(by.id(`server-item-${data.server}`)))
				.toBeVisible()
				.withTimeout(2000);

			await shareTextMessage(message);
		});

		it('should open share without being logged in and go to onboarding', async () => {
			await device.launchApp({
				permissions: { notifications: 'YES' },
				delete: true,
				url: `rocketchat://shareextension?text=whatever`
			});
			await waitFor(element(by.id('new-server-view')))
				.toBeVisible()
				.withTimeout(30000);
		});
	});
});
