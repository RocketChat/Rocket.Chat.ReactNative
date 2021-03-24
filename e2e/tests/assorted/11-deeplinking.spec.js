const {
	device, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { navigateToLogin, login, mockMessage, tapBack, searchRoom } = require('../../helpers/app');

const testuser = data.users.regular
const room = data.channels.detoxpublic.name;
const mainRoom = data.groups.private.name;
async function navigateToRoom(roomName) {
	await searchRoom(`${ roomName }`);
	await waitFor(element(by.id(`rooms-list-view-item-${ roomName }`))).toExist().withTimeout(60000);
	await element(by.id(`rooms-list-view-item-${ roomName }`)).tap();
	await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(5000);
}

describe('Deep linking authentication', () => {
	it('should be logged in server from URL', async() => {
        await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
        await device.launchApp({
            newInstance: true,
            url: 'https://go.rocket.chat/auth?host=open.rocket.chat&token=VGLsN6KCiAkw4zk_y1o0fXZwrw8gJsd3ikEf_ehFlLb&userId=k5cHht7557znqbM32',
            sourceApp: 'com.apple.mobilesafari',
            permissions: { notifications: 'YES' }
          });
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
	});

    it('should be logged in from URL sent to room', async() => {
        await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
        await navigateToLogin();
		await login(testuser.username, testuser.password);
		await element(by.id('login-view-submit')).tap();
		await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
        await navigateToRoom();
        await mockMessage('https://go.rocket.chat/auth?host=open.rocket.chat&token=VGLsN6KCiAkw4zk_y1o0fXZwrw8gJsd3ikEf_ehFlLb&userId=k5cHht7557znqbM32');
	});
});
