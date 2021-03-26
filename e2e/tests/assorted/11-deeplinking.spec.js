const {
	device, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { tapBack, checkServer, navigateToRegister } = require('../../helpers/app');
const { post } = require('../../helpers/data_setup');

describe('Deep linking', () => {
	let userId;
	let token;
	before(async() => {
		const loginResult = await post('login', {
			user: data.users.regular.username,
			password: data.users.regular.password
		})
    userId = loginResult.data.data.userId
    token = loginResult.data.data.authToken
	});

	describe('Authentication', () => {
		const baseDeepLinking = `rocketchat://auth?host=${ data.server.replace(/^(http:\/\/|https:\/\/)/, '') }`;
		it('should run a deep link to an invalid account and raise error', async() => {
			await device.launchApp({
				permissions: { notifications: 'YES' },
				newInstance: true,
				url: `${ baseDeepLinking }&userId=123&token=abc`,
				sourceApp: 'com.apple.mobilesafari'
			});
			await waitFor(element(by.text('You\'ve been logged out by the server. Please log in again.'))).toExist().withTimeout(5000); // TODO: we need to improve this message
		});

		const authAndNavigate = async() => {
			await device.launchApp({
				permissions: { notifications: 'YES' },
				newInstance: true,
				url: `${ baseDeepLinking }&userId=${ userId }&token=${ token }&path=group/${ data.groups.private.name }`,
				sourceApp: 'com.apple.mobilesafari'
			});
			await waitFor(element(by.id(`room-view-title-${ data.groups.private.name }`))).toExist().withTimeout(10000);
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
			await element(by.id('register-view-name')).replaceText(data.registeringUser.username);
			await element(by.id('register-view-username')).replaceText(data.registeringUser.username);
			await element(by.id('register-view-email')).replaceText(data.registeringUser.email);
			await element(by.id('register-view-password')).replaceText(data.registeringUser.password);
			await element(by.id('register-view-submit')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
			await authAndNavigate();
		});
	});
});
