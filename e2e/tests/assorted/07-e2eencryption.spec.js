const {
	expect, element, by, waitFor
} = require('detox');
const { navigateToLogin, login, sleep, tapBack, mockMessage } = require('../../helpers/app');

const data = require('../../data');
const testuser = data.users.regular
const otheruser = data.users.alternate

async function waitForToast() {
	await sleep(300);
}

describe('E2E Encryption', () => {
	before(async () => {
		await device.launchApp({ permissions: { notifications: 'YES' }, delete: true });
		await navigateToLogin();
		await login(testuser.username, testuser.password);
	});

	describe('Render', async () => {
		it('should have encryption badge', async () => {
			await waitFor(element(by.id('listheader-encryption').withDescendant(by.label('Save Your Encryption Password')))).toBeVisible().withTimeout(10000);
		});
	});

	describe('Usage', async () => {
		it('should tap encryption badge and open save password modal', async() => {
			await element(by.id('listheader-encryption')).tap();
			await waitFor(element(by.id('e2e-save-password-view'))).toBeVisible().withTimeout(2000);
		});

		it('should tap "How it works" and navigate', async() => {
			await element(by.id('e2e-save-password-view-how-it-works').and(by.label('How It Works'))).tap();
			await waitFor(element(by.id('e2e-how-it-works-view'))).toBeVisible().withTimeout(2000);
			await tapBack();
		});
		
		it('should tap "Save my password" and close modal', async() => {
			await element(by.id('e2e-save-password-view-saved-password').and(by.label('I Saved My E2E Password'))).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
		});

		it('should create encrypted room', async() => {
			const room = `encrypted${ data.random }`;
			await element(by.id('rooms-list-view-create-channel')).tap();
			await waitFor(element(by.id('new-message-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('new-message-view-create-channel')).tap();
			await waitFor(element(by.id('select-users-view'))).toBeVisible().withTimeout(2000);
			await element(by.id('select-users-view-search')).replaceText(otheruser.username);
			await waitFor(element(by.id(`select-users-view-item-${ otheruser.username }`))).toBeVisible().withTimeout(60000);
			await element(by.id(`select-users-view-item-${ otheruser.username }`)).tap();
			await waitFor(element(by.id(`selected-user-${ otheruser.username }`))).toBeVisible().withTimeout(5000);
			await element(by.id('selected-users-view-submit')).tap();
			await waitFor(element(by.id('create-channel-view'))).toExist().withTimeout(5000);
			await element(by.id('create-channel-name')).replaceText(room);
			await element(by.id('create-channel-encrypted')).longPress();
			await element(by.id('create-channel-submit')).tap();
			await waitFor(element(by.id('room-view'))).toBeVisible().withTimeout(60000);
			await waitFor(element(by.id(`room-view-title-${ room }`))).toBeVisible().withTimeout(60000);
		});
	
		it('should send message and be able to read it', async() => {
			await mockMessage('message');
		});
	});
});