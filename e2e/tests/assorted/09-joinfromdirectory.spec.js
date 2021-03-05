const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../../data');
const { navigateToLogin, login, tapBack } = require('../../helpers/app');

const testuser = data.users.regular

async function navigateToRoom(search) {
	await element(by.id('federation-view-search')).replaceText(search);	
	await waitFor(element(by.id(`federation-view-item-${ search }`))).toBeVisible().withTimeout(10000);
	await expect(element(by.id(`federation-view-item-${ search }`))).toExist();
	await element(by.id(`federation-view-item-${ search }`)).tap();
}

describe('Join room from directory', () => {
	before(async() => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(testuser.username, testuser.password);
	});

	describe('Usage', async() => {
		it('should tap directory', async() => {
			await element(by.id('rooms-list-view-directory')).tap();	
		})

		it('should search and navigate', async() => {
			await navigateToRoom('general');
		})

		it('should back and tap directory', async() => {
			await tapBack();
			await element(by.id('rooms-list-view-directory')).tap();	
		})

		it('should tap dropdown and search user', async() => {
			await element(by.id('federation-view-create-channel')).tap();	
			await element(by.label('Users')).tap();	
			await element(by.label('Search by')).tap();	
			await navigateToRoom('rocket.cat');
		})
		
	});
});
