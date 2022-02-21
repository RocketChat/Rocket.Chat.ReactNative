const { exec } = require('child_process');
const data = require('../data');

const platformTypes = {
	android: {
		// Android types
		alertButtonType: 'android.widget.Button',
		scrollViewType: 'android.widget.ScrollView',
		textInputType: 'android.widget.EditText',
		textMatcher: 'text'
	},
	ios: {
		// iOS types
		alertButtonType: '_UIAlertControllerActionView',
		scrollViewType: 'UIScrollView',
		textInputType: '_UIAlertControllerTextField',
		textMatcher: 'label'
	}
};

function sleep(ms) {
	return new Promise(res => setTimeout(res, ms));
}

async function navigateToWorkspace(server = data.server) {
	await waitFor(element(by.id('new-server-view')))
		.toBeVisible()
		.withTimeout(60000);
	await element(by.id('new-server-view-input')).replaceText(`${server}`);
	await element(by.id('new-server-view-input')).tapReturnKey();
	await waitFor(element(by.id('workspace-view')))
		.toBeVisible()
		.withTimeout(60000);
	await expect(element(by.id('workspace-view'))).toBeVisible();
}

async function navigateToLogin(server) {
	await navigateToWorkspace(server);
	await element(by.id('workspace-view-login')).tap();
	await waitFor(element(by.id('login-view')))
		.toBeVisible()
		.withTimeout(2000);
	await expect(element(by.id('login-view'))).toBeVisible();
}

async function navigateToRegister(server) {
	await navigateToWorkspace(server);
	await element(by.id('workspace-view-register')).tap();
	await waitFor(element(by.id('register-view')))
		.toBeVisible()
		.withTimeout(2000);
}

async function login(username, password) {
	await waitFor(element(by.id('login-view')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('login-view-email')).replaceText(username);
	await element(by.id('login-view-password')).replaceText(password);
	await element(by.id('login-view-submit')).tap();
	await waitFor(element(by.id('rooms-list-view')))
		.toBeVisible()
		.withTimeout(30000);
}

async function logout() {
	const deviceType = device.getPlatform();
	const { scrollViewType, textMatcher } = platformTypes[deviceType];
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-view')))
		.toBeVisible()
		.withTimeout(2000);
	await waitFor(element(by.id('sidebar-settings')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('sidebar-settings')).tap();
	await waitFor(element(by.id('settings-view')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.type(scrollViewType)).atIndex(1).scrollTo('bottom');
	await element(by.id('settings-logout')).tap();
	const logoutAlertMessage = 'You will be logged out of this application.';
	await waitFor(element(by[textMatcher](logoutAlertMessage)).atIndex(0))
		.toExist()
		.withTimeout(10000);
	await expect(element(by[textMatcher](logoutAlertMessage)).atIndex(0)).toExist();
	await element(by[textMatcher]('Logout')).atIndex(0).tap();
	await waitFor(element(by.id('new-server-view')))
		.toBeVisible()
		.withTimeout(10000);
	await expect(element(by.id('new-server-view'))).toBeVisible();
}

async function mockMessage(message, isThread = false) {
	const deviceType = device.getPlatform();
	const { textMatcher } = platformTypes[deviceType];
	const input = isThread ? 'messagebox-input-thread' : 'messagebox-input';
	await element(by.id(input)).replaceText(`${data.random}${message}`);
	await sleep(300);
	await element(by.id('messagebox-send-message')).tap();
	await waitFor(element(by[textMatcher](`${data.random}${message}`)))
		.toExist()
		.withTimeout(60000);
	await element(by[textMatcher](`${data.random}${message}`))
		.atIndex(0)
		.tap();
}

async function starMessage(message) {
	const deviceType = device.getPlatform();
	const { textMatcher } = platformTypes[deviceType];
	const messageLabel = `${data.random}${message}`;
	await element(by[textMatcher](messageLabel)).atIndex(0).longPress();
	await expect(element(by.id('action-sheet'))).toExist();
	await expect(element(by.id('action-sheet-handle'))).toBeVisible();
	await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
	await element(by[textMatcher]('Star')).atIndex(0).tap();
	await waitFor(element(by.id('action-sheet')))
		.not.toExist()
		.withTimeout(5000);
}

async function pinMessage(message) {
	const deviceType = device.getPlatform();
	const { textMatcher } = platformTypes[deviceType];
	const messageLabel = `${data.random}${message}`;
	await waitFor(element(by[textMatcher](messageLabel)).atIndex(0)).toExist();
	await element(by[textMatcher](messageLabel)).atIndex(0).longPress();
	await expect(element(by.id('action-sheet'))).toExist();
	await expect(element(by.id('action-sheet-handle'))).toBeVisible();
	await element(by.id('action-sheet-handle')).swipe('up', 'fast', 0.5);
	await element(by[textMatcher]('Pin')).atIndex(0).tap();
	await waitFor(element(by.id('action-sheet')))
		.not.toExist()
		.withTimeout(5000);
}

async function dismissReviewNag() {
	const deviceType = device.getPlatform();
	const { textMatcher } = platformTypes[deviceType];
	await waitFor(element(by[textMatcher]('Are you enjoying this app?')))
		.toExist()
		.withTimeout(60000);
	await element(by[textMatcher]('No')).atIndex(0).tap(); // Tap `no` on ask for review alert
}

async function tapBack() {
	await element(by.id('header-back')).atIndex(0).tap();
}

async function searchRoom(room) {
	await waitFor(element(by.id('rooms-list-view')))
		.toBeVisible()
		.withTimeout(30000);
	await element(by.id('rooms-list-view-search')).tap();
	await expect(element(by.id('rooms-list-view-search-input'))).toExist();
	await waitFor(element(by.id('rooms-list-view-search-input')))
		.toExist()
		.withTimeout(5000);
	await sleep(300);
	await element(by.id('rooms-list-view-search-input')).replaceText(room);
	await sleep(300);
	await waitFor(element(by.id(`rooms-list-view-item-${room}`)))
		.toBeVisible()
		.withTimeout(60000);
}

async function tryTapping(theElement, timeout, longtap = false) {
	try {
		if (longtap) {
			await theElement.longPress();
		} else {
			await theElement.tap();
		}
	} catch (e) {
		if (timeout <= 0) {
			// TODO: Maths. How closely has the timeout been honoured here?
			throw e;
		}
		await sleep(100);
		await tryTapping(theElement, timeout - 100);
	}
}

const checkServer = async server => {
	const label = `Connected to ${server}`;
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-view')))
		.toBeVisible()
		.withTimeout(2000);
	await waitFor(element(by.label(label)))
		.toBeVisible()
		.withTimeout(10000);
	await waitFor(element(by.id('sidebar-close-drawer')))
		.toBeVisible()
		.withTimeout(10000);
	await element(by.id('sidebar-close-drawer')).tap();
};

function runCommand(command) {
	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(new Error(`exec error: ${stderr}`));
				return;
			}
			resolve();
		});
	});
}

async function prepareAndroid() {
	if (device.getPlatform() !== 'android') {
		return;
	}
	await runCommand('adb shell settings put secure spell_checker_enabled 0');
	await runCommand('adb shell settings put secure autofill_service null');
	await runCommand('adb shell settings put global window_animation_scale 0.0');
	await runCommand('adb shell settings put global transition_animation_scale 0.0');
	await runCommand('adb shell settings put global animator_duration_scale 0.0');
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
	tryTapping,
	checkServer,
	platformTypes,
	prepareAndroid
};
