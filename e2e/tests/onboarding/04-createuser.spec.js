const {
	device, expect, element, by, waitFor
} = require('detox');
const { navigateToRegister, sleep } = require('../../helpers/app');
const data = require('../../data');

describe('Create user screen', () => {
	before(async() => {
		await device.launchApp({ newInstance: true });
		await navigateToRegister();
	});

	describe('Render', () => {
		it('should have create user screen', async() => {
			await expect(element(by.id('register-view'))).toBeVisible();
		});

		it('should have name input', async() => {
			await expect(element(by.id('register-view-name'))).toBeVisible();
		});

		it('should have email input', async() => {
			await expect(element(by.id('register-view-email'))).toBeVisible();
		});

		it('should have password input', async() => {
			await expect(element(by.id('register-view-password'))).toBeVisible();
		});

		it('should have submit button', async() => {
			await expect(element(by.id('register-view-submit'))).toBeVisible();
		});

		it('should have legal button', async() => {
			await expect(element(by.id('register-view-more'))).toBeVisible();
		});
	});

	describe('Usage', () => {
		// FIXME: Detox isn't able to check if it's tappable: https://github.com/wix/Detox/issues/246
		// it('should submit invalid email and do nothing', async() => {
		// 	const invalidEmail = 'invalidemail';
		// 	await element(by.id('register-view-name')).replaceText(data.user);
		// 	await element(by.id('register-view-username')).replaceText(data.user);
		// 	await element(by.id('register-view-email')).replaceText(invalidEmail);
		// 	await element(by.id('register-view-password')).replaceText(data.password);
		// 	await element(by.id('register-view-submit')).tap();
		// });

		it('should submit email already taken and raise error', async() => {
			const invalidEmail = 'invalidemail';
			await element(by.id('register-view-name')).replaceText(data.user);
			await element(by.id('register-view-username')).replaceText(data.user);
			await element(by.id('register-view-email')).replaceText(data.existingEmail);
			await element(by.id('register-view-password')).replaceText(data.password);
			await sleep(300);
			await element(by.id('register-view-submit')).tap();
			await waitFor(element(by.text('Email already exists. [403]')).atIndex(0)).toExist().withTimeout(10000);
			await expect(element(by.text('Email already exists. [403]')).atIndex(0)).toExist();
			await element(by.text('OK')).tap();
		});

		it('should submit username already taken and raise error', async() => {
			const invalidEmail = 'invalidemail';
			await element(by.id('register-view-name')).replaceText(data.user);
			await element(by.id('register-view-username')).replaceText(data.existingName);
			await element(by.id('register-view-email')).replaceText(data.email);
			await element(by.id('register-view-password')).replaceText(data.password);
			await sleep(300);
			await element(by.id('register-view-submit')).tap();
			await waitFor(element(by.text('Username is already in use')).atIndex(0)).toExist().withTimeout(10000);
			await expect(element(by.text('Username is already in use')).atIndex(0)).toExist();
			await element(by.text('OK')).tap();
		});

		it('should register', async() => {
			await element(by.id('register-view-name')).replaceText(data.user);
			await element(by.id('register-view-username')).replaceText(data.user);
			await element(by.id('register-view-email')).replaceText(data.email);
			await element(by.id('register-view-password')).replaceText(data.password);
			await sleep(300);
			await element(by.id('register-view-submit')).tap();
			await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
			await expect(element(by.id('rooms-list-view'))).toBeVisible();
		});
	});
});
