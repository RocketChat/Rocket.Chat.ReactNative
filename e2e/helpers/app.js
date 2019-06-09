const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../data');

async function navigateToLogin() {

    try {
        await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
        await expect(element(by.id('login-view'))).toBeVisible();
    } catch (error) {
        await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
        await element(by.id('welcome-view-login')).tap();
		await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
		await expect(element(by.id('login-view'))).toBeVisible();
    }
}

async function login() {
    await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
    await element(by.id('login-view-email')).replaceText(data.user);
    await element(by.id('login-view-password')).replaceText(data.password);
    await element(by.id('login-view-submit')).tap();
    await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
}

async function logout() {
    await element(by.id('rooms-list-view-sidebar')).tap();
    await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
	await waitFor(element(by.id('sidebar-logout'))).toBeVisible().withTimeout(2000);
    await element(by.id('sidebar-logout')).tap();
    await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
    await expect(element(by.id('login-view'))).toBeVisible();
}

async function tapBack() {
    await element(by.id('header-back')).atIndex(0).tap();
}

async function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

module.exports = {
    navigateToLogin,
    login,
    logout,
    tapBack,
    sleep
};