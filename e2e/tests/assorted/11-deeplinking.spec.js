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

describe('Deep linking', () => {
    // it('should handle push notification to room', async() => {
    //     await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
    //     await device.sendUserNotification(localNotification);
    //     await expect(element(by.text('from local notification'))).toBeVisible();
    // })

    describe('Deep linking authentication', () => {
        it('should be logged in to server directly from URL', async() => {
            await device.launchApp({
                newInstance: false,
                url: 'https://go.rocket.chat/auth', 
                sourceApp: 'com.apple.mobilesafari'
              });
            await expect(element(by.text('Open'))).toBeVisible();
        });
    
        it('should be logged in from URL sent to room', async() => {
            await device.launchApp({ permissions: { notifications: 'YES' }, newInstance: true, delete: true });
            await navigateToLogin();
            await login(testuser.username, testuser.password);
            await element(by.id('login-view-submit')).tap();
            await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
            await navigateToRoom();
            await mockMessage('https://go.rocket.chat/auth');
        });
    });
});
