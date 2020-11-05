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
    await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(20000);
    await navigateToWorkspace();
	await element(by.id('workspace-view-login')).tap();
    await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
    await expect(element(by.id('login-view'))).toBeVisible();
}

async function navigateToRegister() {
    await waitFor(element(by.id('onboarding-view'))).toBeVisible().withTimeout(20000);
    await navigateToWorkspace();
	await element(by.id('workspace-view-register')).tap();
    await waitFor(element(by.id('register-view'))).toBeVisible().withTimeout(2000);
    await expect(element(by.id('register-view'))).toBeVisible();
}

async function login(username, password) {
    await waitFor(element(by.id('login-view'))).toBeVisible().withTimeout(2000);
    await element(by.id('login-view-email')).replaceText(username);
    await element(by.id('login-view-password')).replaceText(password);
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
	await element(by.id('messagebox-input')).atIndex(0).tap();
	await element(by.id('messagebox-input')).atIndex(0).typeText(`${ data.random }${ message }`);
	await element(by.id('messagebox-send-message')).atIndex(0).tap();
	await waitFor(element(by.label(`${ data.random }${ message }`)).atIndex(0)).toExist().withTimeout(60000);
    await expect(element(by.label(`${ data.random }${ message }`)).atIndex(0)).toExist();
    await element(by.label(`${ data.random }${ message }`)).atIndex(0).tap();
};

async function starMessage(message){
    const messageLabel = `${ data.random }${ message }`
    await waitFor(element(by.label(messageLabel))).toBeVisible().withTimeout(5000);
    await element(by.label(messageLabel)).atIndex(0).longPress();
    await expect(element(by.id('action-sheet'))).toExist();
    await expect(element(by.id('action-sheet-handle'))).toBeVisible();
    await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
    await element(by.label('Star')).tap();
    await waitFor(element(by.id('action-sheet'))).toNotExist().withTimeout(5000);
};

async function pinMessage(message){
    const messageLabel = `${ data.random }${ message }`
    await waitFor(element(by.label(messageLabel)).atIndex(0)).toExist();
    await element(by.label(messageLabel)).atIndex(0).longPress();
    await expect(element(by.id('action-sheet'))).toExist();
    await expect(element(by.id('action-sheet-handle'))).toBeVisible();
    await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
    await element(by.label('Pin')).tap();
    await waitFor(element(by.id('action-sheet'))).toNotExist().withTimeout(5000);
}

async function dismissReviewNag(){
    await waitFor(element(by.text('Are you enjoying this app?'))).toExist().withTimeout(60000);
    await element(by.label('No').and(by.type('_UIAlertControllerActionView'))).tap(); // Tap `no` on ask for review alert
}

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
}

async function tryTapping(theElement, timeout, longtap = false){
	try {
        if(longtap){
            await theElement.longPress()
        } else {
            await theElement.tap()
        }
	} catch(e) {
		if(timeout <= 0){ //TODO: Maths. How closely has the timeout been honoured here?
			throw e
		}
		await sleep(100)
		await tryTapping(theElement, timeout - 100)
	}
}

module.exports = {
    navigateToWorkspace,
    navigateToLogin,
    navigateToRegister,
    login,
    logout,
    mockMessage,
    starMessage,
    pinMessage,
    dismissReviewNag,
    tapBack,
    sleep,
    searchRoom,
    tryTapping
};