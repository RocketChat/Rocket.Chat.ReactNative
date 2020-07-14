const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../data');

async function navigateToWorkspace() {
    await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(10000);
	await element(by.id('join-workspace')).tap();
	await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(60000);
	await element(by.id('new-server-view-input')).replaceText(data.server);
	await element(by.id('new-server-view-button')).tap();
	await waitFor(element(by.id('workspace-view'))).toBeVisible().withTimeout(60000);
	await expect(element(by.id('workspace-view'))).toBeVisible();
}

async function navigateToLogin() {
    await navigateToWorkspace();
	await element(by.id('workspace-view-login')).tap();
    await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
    await expect(element(by.id('login-view'))).toBeVisible();
}

async function navigateToRegister() {
    await navigateToWorkspace();
	await element(by.id('workspace-view-register')).tap();
    await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
    await expect(element(by.id('register-view'))).toBeVisible();
}

async function login(username, password) {
    await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
    await element(by.id('login-view-email')).replaceText(username);
    await element(by.id('login-view-password')).replaceText(password);
    await sleep(300);
    await element(by.id('login-view-submit')).tap();
    await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(10000);
}

async function logout() {
    await element(by.id('rooms-list-view-sidebar')).tap();
    await waitFor(element(by.id('sidebar-view'))).toBeVisible().withTimeout(2000);
	await waitFor(element(by.id('sidebar-settings'))).toBeVisible().withTimeout(2000);
    await element(by.id('sidebar-settings')).tap();
    await waitFor(element(by.id('settings-view'))).toBeVisible().withTimeout(2000);
    await element(by.type('UIScrollView')).atIndex(1).scrollTo('bottom');
    await element(by.id('settings-logout')).tap();
    const logoutAlertMessage = 'You will be logged out of this application.';
    await waitFor(element(by.text(logoutAlertMessage)).atIndex(0)).toExist().withTimeout(10000);
    await expect(element(by.text(logoutAlertMessage)).atIndex(0)).toExist();
    await element(by.text('Logout')).tap();
    await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(10000);
    await expect(element(by.id('onboarding-view'))).toBeVisible();
}

async function mockMessage(message) {
	await element(by.id('messagebox-input')).tap();
	await element(by.id('messagebox-input')).typeText(`${ data.random }${ message }`);
	await element(by.id('messagebox-send-message')).tap();
	await waitFor(element(by.label(`${ data.random }${ message }`)).atIndex(0)).toExist().withTimeout(60000);
    await expect(element(by.label(`${ data.random }${ message }`)).atIndex(0)).toExist();
    await element(by.label(`${ data.random }${ message }`)).atIndex(0).tap();
};

async function tapBack() {
    await element(by.id('header-back')).atIndex(0).tap();
}

async function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

async function searchRoom(room) {
    await element(by.id('rooms-list-view-search')).tap();
	await expect(element(by.id('rooms-list-view-search-input'))).toExist();
	await waitFor(element(by.id('rooms-list-view-search-input'))).toExist().withTimeout(5000);
    await element(by.id('rooms-list-view-search-input')).typeText(room);
    await sleep(2000);
}

module.exports = {
    navigateToWorkspace,
    navigateToLogin,
    navigateToRegister,
    login,
    logout,
    mockMessage,
    tapBack,
    sleep,
    searchRoom
};