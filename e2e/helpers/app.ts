import Detox, { device, waitFor, element, by, expect } from 'detox';

import data from '../data';

export type TTextMatcher = keyof Pick<Detox.ByFacade, 'text' | 'label'>;

const platformTypes = {
	android: {
		// Android types
		alertButtonType: 'android.widget.Button',
		scrollViewType: 'android.widget.ScrollView',
		textInputType: 'android.widget.EditText',
		textMatcher: 'text' as TTextMatcher
	},
	ios: {
		// iOS types
		alertButtonType: '_UIAlertControllerActionView',
		scrollViewType: 'UIScrollView',
		textInputType: '_UIAlertControllerTextField',
		textMatcher: 'label' as TTextMatcher
	}
};

function sleep(ms: number) {
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

async function navigateToLogin(server?: string) {
	await navigateToWorkspace(server);
	await element(by.id('workspace-view-login')).tap();
	await waitFor(element(by.id('login-view')))
		.toExist()
		.withTimeout(2000);
}

async function navigateToRegister(server?: string) {
	await navigateToWorkspace(server);
	await element(by.id('workspace-view-register')).tap();
	await waitFor(element(by.id('register-view')))
		.toExist()
		.withTimeout(2000);
}

async function login(username: string, password: string) {
	await waitFor(element(by.id('login-view')))
		.toExist()
		.withTimeout(2000);
	await element(by.id('login-view-email')).replaceText(username);
	await element(by.id('login-view-email')).tapReturnKey();
	await element(by.id('login-view-password')).replaceText(password);
	await element(by.id('login-view-password')).tapReturnKey();
	await waitFor(element(by.id('rooms-list-view')))
		.toExist()
		.withTimeout(30000);
}

async function logout() {
	const deviceType = device.getPlatform();
	const { textMatcher } = platformTypes[deviceType];
	await element(by.id('rooms-list-view-sidebar')).tap();
	await waitFor(element(by.id('sidebar-view')))
		.toBeVisible()
		.withTimeout(2000);
	await waitFor(element(by.id('sidebar-settings')))
		.toBeVisible()
		.withTimeout(2000);
	await element(by.id('sidebar-settings')).tap();
	await element(by.id('settings-view')).swipe('up');
	await waitFor(element(by.id('settings-logout')))
		.toBeVisible()
		.withTimeout(2000);
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

async function checkMessage(message: string) {
	const deviceType = device.getPlatform();
	const { textMatcher } = platformTypes[deviceType];
	await waitFor(element(by[textMatcher](message)))
		.toExist()
		.withTimeout(60000);
	await element(by[textMatcher](message)).atIndex(0).tap();
}

async function mockMessage(message: string, isThread = false) {
	const input = isThread ? 'message-composer-input-thread' : 'message-composer-input';
	await element(by.id(input)).typeText(message);
	await element(by.id('message-composer-send')).tap();
	await checkMessage(message);
	return message;
}

async function tapBack() {
	if (device.getPlatform() === 'ios') {
		try {
			await element(by.type('UIAccessibilityBackButtonElement')).tap();
		} catch (error) {
			await element(by.id('header-back')).atIndex(0).tap();
		}
	} else {
		try {
			await element(by.label('Navigate up')).tap();
		} catch (error) {
			await element(by.id('header-back')).atIndex(0).tap();
		}
	}
}

async function searchRoom(
	room: string,
	nativeElementAction: keyof Pick<Detox.NativeElementActions, 'typeText' | 'replaceText'> = 'typeText',
	roomTestID?: string
) {
	const testID = roomTestID || `rooms-list-view-item-${room}`;
	await waitFor(element(by.id('rooms-list-view')))
		.toExist()
		.withTimeout(30000);

	try {
		await waitFor(element(by.id(testID)))
			.toBeVisible()
			.withTimeout(2000);
		await expect(element(by.id(testID))).toBeVisible();
	} catch {
		await tapAndWaitFor(element(by.id('rooms-list-view-search')), element(by.id('rooms-list-view-search-input')), 5000);
		if (nativeElementAction === 'replaceText') {
			// trigger the input's onChangeText
			await element(by.id('rooms-list-view-search-input')).typeText(' ');
		}
		await element(by.id('rooms-list-view-search-input'))[nativeElementAction](room);
		await sleep(500);
		await waitFor(element(by.id(testID)))
			.toBeVisible()
			.withTimeout(60000);
	}
}

async function navigateToRoom(room: string) {
	await searchRoom(room);
	await element(by.id(`rooms-list-view-item-${room}`)).tap();
	await checkRoomTitle(room);
}

async function navigateToRecentRoom(room: string) {
	await waitFor(element(by.id('rooms-list-view')))
		.toExist()
		.withTimeout(10000);
	await tapAndWaitFor(element(by.id('rooms-list-view-search')), element(by.id('rooms-list-view-search-input')), 5000);
	await waitFor(element(by.id(`rooms-list-view-item-${room}`)))
		.toBeVisible()
		.withTimeout(10000);
	await element(by.id(`rooms-list-view-item-${room}`)).tap();
	await waitFor(element(by.id(`room-view-title-${room}`)))
		.toBeVisible()
		.withTimeout(10000);
}

async function tryTapping(
	theElement: Detox.IndexableNativeElement | Detox.NativeElement,
	timeout: number,
	longPress = false
): Promise<void> {
	try {
		if (longPress) {
			await theElement.tap();
			await theElement.longPress();
		} else {
			await theElement.tap();
		}
	} catch (e) {
		if (timeout <= 0) {
			throw e;
		}
		return tryTapping(theElement, timeout - 100);
	}
}

async function jumpToQuotedMessage(theElement: Detox.IndexableNativeElement | Detox.NativeElement): Promise<void> {
	const deviceType = device.getPlatform();
	const { textMatcher } = platformTypes[deviceType];
	await tryTapping(theElement, 2000, true);
	await element(by[textMatcher]('Jump to message')).atIndex(0).tap();
}

async function tapAndWaitFor(
	elementToTap: Detox.IndexableNativeElement | Detox.NativeElement,
	elementToWaitFor: Detox.IndexableNativeElement | Detox.NativeElement,
	timeout: number,
	longPress = false
) {
	try {
		if (longPress) {
			elementToTap.longPress();
		} else {
			await elementToTap.tap();
		}
		await waitFor(elementToWaitFor).toBeVisible().withTimeout(1000);
		await sleep(300); // Wait for animation
	} catch (e) {
		if (timeout <= 0) {
			throw e;
		}
		await sleep(100);
		await tapAndWaitFor(elementToTap, elementToWaitFor, timeout - 100);
	}
}

async function checkRoomTitle(room: string) {
	await waitFor(element(by.id(`room-view-title-${room}`)))
		.toBeVisible()
		.withTimeout(60000);
}

const checkServer = async (server: string) => {
	const label = `Connected to ${server}`;
	await waitFor(element(by.id('rooms-list-view-sidebar')))
		.toBeVisible()
		.withTimeout(2000);
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

	if (device.getPlatform() === 'ios') {
		await waitFor(element(by.id('sidebar-close-drawer')))
			.not.toBeVisible()
			.withTimeout(10000);
	} else {
		// toBeVisible is not working on Android
		// It is always visible, even when it's not
		await sleep(2000);
	}
};

// Useful to get rid of `Too many requests` alert on register
async function expectValidRegisterOrRetry(platform: keyof typeof platformTypes, retries = 3) {
	if (retries === 0) {
		throw new Error('Too many retries');
	}
	try {
		await waitFor(element(by.id('rooms-list-view')))
			.toBeVisible()
			.withTimeout(60000);
	} catch (error) {
		/**
		 * We can't use regex to properly match by label, so we assume [error-too-many-requests] is visible.
		 * We don't need to wait for another 60 seconds, because we already did above, so we just try again.
		 *  */
		await element(by[platformTypes[platform].textMatcher]('OK').and(by.type(platformTypes[platform].alertButtonType))).tap();
		await element(by.id('register-view-submit')).tap();
		await expectValidRegisterOrRetry(platform, retries - 1);
	}
}

export {
	navigateToWorkspace,
	navigateToLogin,
	navigateToRegister,
	login,
	logout,
	checkMessage,
	mockMessage,
	tapBack,
	sleep,
	searchRoom,
	navigateToRoom,
	tryTapping,
	tapAndWaitFor,
	checkRoomTitle,
	checkServer,
	platformTypes,
	expectValidRegisterOrRetry,
	jumpToQuotedMessage,
	navigateToRecentRoom
};
