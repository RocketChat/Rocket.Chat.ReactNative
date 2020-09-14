const {
	expect, element, by, waitFor
} = require('detox');
const { navigateToLogin, login, sleep, tapBack } = require('../../helpers/app');

const data = require('../../data');
const testuser = data.users.regular

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
			await element(by.id('e2e-how-it-works-view').and(by.label('I Saved By E2E Password'))).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(2000);
		});
		// it('should change status', async () => {
		// 	await element(by.id('status-view-busy')).tap();
		// 	await expect(element(by.id('status-view-current-busy'))).toExist();
		// });

		// it('should change status text', async () => {
		// 	await element(by.id('status-view-input')).replaceText('status-text-new');
		// 	await element(by.id('status-view-submit')).tap();
		// 	await waitForToast();
		// 	await waitFor(element(by.label('status-text-new').withAncestor(by.id('sidebar-custom-status')))).toBeVisible().withTimeout(2000);
		// });
	});
});