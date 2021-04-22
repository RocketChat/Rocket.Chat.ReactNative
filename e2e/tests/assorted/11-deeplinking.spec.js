const {
	device, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { tapBack, checkServer, navigateToRegister } = require('../../helpers/app');
const { post, get, login } = require('../../helpers/data_setup');

const DEEPLINK_METHODS = { AUTH: 'auth', ROOM: 'room' };
const getDeepLink = (method, server, params) => {
	const deeplink = `rocketchat://${ method }?host=${ server.replace(/^(http:\/\/|https:\/\/)/, '') }&${params}`;
	console.log(`Deeplinking to: ${ deeplink }`);
	return deeplink;
};

describe('Deep linking', () => {
	let userId;
	let authToken;
	before(async() => {
		const loginResult = await login(data.users.regular.username, data.users.regular.password);
		({ userId, authToken } = loginResult);
	});

	describe('Authentication', () => {
		it('should run a deep link to an invalid account and raise error', async() => {
			await device.launchApp({
				permissions: { notifications: 'YES' },
				delete: true,
				url: getDeepLink(DEEPLINK_METHODS.AUTH, data.server, 'userId=123&token=abc'),
				sourceApp: 'com.apple.mobilesafari'
			});
			await waitFor(element(by.text('You\'ve been logged out by the server. Please log in again.'))).toExist().withTimeout(10000); // TODO: we need to improve this message
		});

		const authAndNavigate = async() => {
			await device.launchApp({
				permissions: { notifications: 'YES' },
				newInstance: true,
				url: getDeepLink(DEEPLINK_METHODS.AUTH, data.server, `userId=${ userId }&token=${ authToken }&path=group/${ data.groups.private.name }`),
				sourceApp: 'com.apple.mobilesafari'
			});
			await waitFor(element(by.id(`room-view-title-${ data.groups.private.name }`))).toExist().withTimeout(30000);
			await tapBack();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
			await checkServer(data.server);
			await waitFor(element(by.id(`rooms-list-view-item-${ data.groups.private.name }`))).toBeVisible().withTimeout(2000);
		}

		it('should authenticate and navigate', async() => {
			await authAndNavigate();
		});

		it('should authenticate while logged in another server', async() => {
			await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
			await navigateToRegister(data.alternateServer);
			await element(by.id('register-view-name')).replaceText(data.registeringUser4.username);
			await element(by.id('register-view-username')).replaceText(data.registeringUser4.username);
			await element(by.id('register-view-email')).replaceText(data.registeringUser4.email);
			await element(by.id('register-view-password')).typeText(data.registeringUser4.password);
			await element(by.id('register-view-submit')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
			await authAndNavigate();
		});
	});

	describe('Room', () => {
		describe('While logged in', async() => {
			it('should navigate to the room using path', async() => {
				await device.launchApp({
					permissions: { notifications: 'YES' },
					newInstance: true,
					url: getDeepLink(DEEPLINK_METHODS.ROOM, data.server, `path=group/${ data.groups.private.name }`),
					sourceApp: 'com.apple.mobilesafari'
				});
				await waitFor(element(by.id(`room-view-title-${ data.groups.private.name }`))).toExist().withTimeout(10000);
			});

			it('should navigate to the room using rid', async() => {
				const roomResult = await get(`groups.info?roomName=${ data.groups.private.name }`)
				await device.launchApp({
					permissions: { notifications: 'YES' },
					newInstance: true,
					url: getDeepLink(DEEPLINK_METHODS.ROOM, data.server, `rid=${ roomResult.data.group._id }`),
					sourceApp: 'com.apple.mobilesafari'
				});
				await waitFor(element(by.id(`room-view-title-${ data.groups.private.name }`))).toExist().withTimeout(15000);
				await tapBack();
			});
		});

		describe('Others', async() => {
			it('should change server', async() => {
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
				await element(by.id('rooms-list-header-server-dropdown-button')).tap();
				await waitFor(element(by.id('rooms-list-header-server-dropdown'))).toBeVisible().withTimeout(5000);
				await element(by.id(`rooms-list-header-server-${ data.alternateServer }`)).tap();
				await checkServer(data.alternateServer);

				await device.launchApp({
					permissions: { notifications: 'YES' },
					newInstance: true,
					url: getDeepLink(DEEPLINK_METHODS.ROOM, data.server, `path=group/${ data.groups.private.name }`),
					sourceApp: 'com.apple.mobilesafari'
				});
				await waitFor(element(by.id(`room-view-title-${ data.groups.private.name }`))).toExist().withTimeout(10000);
			});

			it('should add a not existing server and fallback to the previous one', async() => {
				await device.launchApp({
					permissions: { notifications: 'YES' },
					newInstance: true,
					url: getDeepLink(DEEPLINK_METHODS.ROOM, 'https://google.com'),
					sourceApp: 'com.apple.mobilesafari'
				});
				await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
				await checkServer(data.server);
			});
		});
	});
});
