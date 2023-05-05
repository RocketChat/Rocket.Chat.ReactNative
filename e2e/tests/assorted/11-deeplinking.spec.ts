import { device, waitFor, element, by } from 'detox';
import EJSON from 'ejson';

import data from '../../data';
import {
	tapBack,
	checkServer,
	navigateToRegister,
	platformTypes,
	TTextMatcher,
	expectValidRegisterOrRetry
} from '../../helpers/app';
import { createRandomRoom, createRandomUser, login, sendMessage } from '../../helpers/data_setup';
import random from '../../helpers/random';

const DEEPLINK_METHODS = { AUTH: 'auth', ROOM: 'room' };

let amp = '&';

const getDeepLink = (method: string, server: string, params?: string) => {
	const deeplink = `rocketchat://${method}?host=${server.replace(/^(http:\/\/|https:\/\/)/, '')}${amp}${params}`;
	console.log(`Deeplinking to: ${deeplink}`);
	return deeplink;
};

describe('Deep linking', () => {
	let userId: string;
	let authToken: string;
	let threadId: string;
	let textMatcher: TTextMatcher;
	let rid: string;
	let room: string;
	const threadMessage = `to-thread-${random()}`;

	beforeAll(async () => {
		const user = await createRandomUser();
		({ _id: rid, name: room } = await createRandomRoom(user, 'p'));
		const loginResult = await login(user.username, user.password);
		({ userId, authToken } = loginResult);
		const deviceType = device.getPlatform();
		amp = deviceType === 'android' ? '\\&' : '&';
		({ textMatcher } = platformTypes[deviceType]);
		// create a thread with api
		const result = await sendMessage(user, room, threadMessage);
		threadId = result.message._id;
		await sendMessage(user, result.message.rid, random(), threadId);
	});

	describe('Authentication', () => {
		it('should run a deep link to an invalid account and raise error', async () => {
			await device.launchApp({
				permissions: { notifications: 'YES' },
				delete: true,
				url: getDeepLink(DEEPLINK_METHODS.AUTH, data.server, `userId=123${amp}token=abc`)
			});
			await waitFor(element(by[textMatcher]("You've been logged out by the workspace. Please log in again.")))
				.toExist()
				.withTimeout(30000); // TODO: we need to improve this message
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

		it('should authenticate and navigate', async () => {
			await authAndNavigate();
		});

		it('should authenticate while logged in another server', async () => {
			await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
			await navigateToRegister(data.alternateServer);
			const randomUser = data.randomUser();
			await element(by.id('register-view-name')).replaceText(randomUser.name);
			await element(by.id('register-view-username')).replaceText(randomUser.username);
			await element(by.id('register-view-email')).replaceText(randomUser.email);
			await element(by.id('register-view-password')).replaceText(randomUser.password);
			await element(by.id('register-view-password')).tapReturnKey();
			await expectValidRegisterOrRetry(device.getPlatform());
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
				await element(by.id('rooms-list-header-server-dropdown-button')).tap();
				await waitFor(element(by.id('rooms-list-header-server-dropdown')))
					.toBeVisible()
					.withTimeout(5000);
				await element(by.id(`rooms-list-header-server-${data.alternateServer}`)).tap();
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
});
