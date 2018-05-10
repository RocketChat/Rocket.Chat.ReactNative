const {
	device, expect, element, by, waitFor
} = require('detox');
const data = require('../data');

async function addServer() {
    await waitFor(element(by.id('new-server-view'))).toBeVisible().withTimeout(2000);
    await element(by.id('new-server-view-input')).replaceText(data.server);
    await waitFor(element(by.text(' is a valid Rocket.Chat instance'))).toBeVisible().withTimeout(2000);
    await waitFor(element(by.id('new-server-view-button'))).toBeVisible().withTimeout(2000);
    await element(by.id('new-server-view-button')).tap();
}

async function navigateToLogin() {
    await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
    await element(by.id('welcome-view-login')).tap();
    await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
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
    await waitFor(element(by.id('sidebar'))).toBeVisible().withTimeout(2000);
    await element(by.id('sidebar-logout')).tap();
    await waitFor(element(by.id('welcome-view'))).toBeVisible().withTimeout(2000);
    await expect(element(by.id('welcome-view'))).toBeVisible();
}

module.exports = {
    addServer,
    navigateToLogin,
    login,
    logout
};