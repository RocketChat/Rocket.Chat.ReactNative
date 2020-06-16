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

async function login() {
    await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
    await element(by.id('login-view-email')).replaceText(data.user);
    await element(by.id('login-view-password')).replaceText(data.password);
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

async function createUser() {
    await navigateToRegister();
    await element(by.id('register-view-name')).replaceText(data.user);
    await element(by.id('register-view-username')).replaceText(data.user);
    await element(by.id('register-view-email')).replaceText(data.email);
    await element(by.id('register-view-password')).replaceText(data.password);
    await sleep(300);
    await element(by.id('register-view-submit')).tap();
    await waitFor(element(by.id('rooms-list-view'))).toBeVisible().withTimeout(60000);
    await expect(element(by.id('rooms-list-view'))).toBeVisible();
}

async function tapBack() {
    await element(by.id('header-back')).atIndex(0).tap();
}

async function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

module.exports = {
    navigateToWorkspace,
    navigateToLogin,
    navigateToRegister,
    login,
    logout,
    createUser,
    tapBack,
    sleep
};