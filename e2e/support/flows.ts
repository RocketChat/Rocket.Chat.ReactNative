import type { Locator, TestFixtures } from 'e2e';
import type { Device } from '@e2e-dev/mobile';
import type { Appduct } from '@appduct/e2e';
import { expect } from 'e2e';
import { TestError } from 'e2e/engine';

import { getDeepLink, login, type Credentials } from './api';
import { data } from './data';
import { delay } from './timing';

export type Fixtures = TestFixtures & { device: Device; appduct: Appduct };

export const LONG_TIMEOUT = 60_000;

const errorCode = (error: unknown) => (error as { code?: string } | null)?.code;

export const succeeds = async (assertion: Promise<unknown>) => {
	try {
		await assertion;
		return true;
	} catch (error) {
		if (errorCode(error) !== 'ASSERTION_FAILED') throw error;
		return false;
	}
};

export const isVisibleNow = (locator: Locator) => locator.isVisible();

const NONE_VISIBLE_ERROR = 'None of the expected elements became visible';
const FIRST_VISIBLE_POLL_INTERVAL = 250;

export const firstVisible = async (candidates: readonly Locator[], timeout = LONG_TIMEOUT) => {
	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		for (const candidate of candidates) {
			if (await isVisibleNow(candidate)) {
				return candidate;
			}
		}
		await delay(FIRST_VISIBLE_POLL_INTERVAL);
	}
	throw new TestError('ASSERTION_FAILED', NONE_VISIBLE_ERROR);
};

export const tapIfVisible = async (target: Locator) => {
	if (await isVisibleNow(target)) {
		await tapWhenUncovered(target);
	}
};

export const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const exactName = (label: string | RegExp) => (typeof label === 'string' ? new RegExp(`^${escapeRegExp(label)}$`) : label);

export const headerItem = ({ screen, platform }: Fixtures, testId: string, iosLabel: string | RegExp) =>
	platform === 'ios' ? screen.getByRole('button', { name: exactName(iosLabel) }).first() : screen.getByTestId(testId).first();

export const headerSearchInput = ({ screen, platform }: Fixtures, testId: string) =>
	platform === 'ios' ? screen.getByRole('textbox', { name: 'Search' }).first() : screen.getByTestId(testId);

const roomTitleTestId = (title: string | RegExp) =>
	typeof title === 'string'
		? `room-view-title-${title}`
		: new RegExp(`^room-view-title-${title.source.replace(/^\^/, '')}`, title.flags);

export const roomTitle = ({ screen, platform }: Fixtures, title: string | RegExp) =>
	platform === 'ios'
		? screen
				.getByTestId('room-header', { visible: true })
				.filter({ hasText: exactName(title) })
				.first()
		: screen.getByTestId(roomTitleTestId(title));

const CONNECTED_SERVER_HOST = /^[\w-]+(\.[\w-]+)+$/;

export const expectServerConnected = ({ screen, platform }: Fixtures, host: string | RegExp = CONNECTED_SERVER_HOST) =>
	platform === 'ios'
		? expect(screen.getByTestId('rooms-list-header-servers-list-button').getByText(host)).toBeVisible({ timeout: LONG_TIMEOUT })
		: expect(screen.getByTestId('rooms-list-header-server-subtitle')).toHaveText(host, { timeout: LONG_TIMEOUT });

export const expectVisible = ({ screen }: Fixtures, testId: string) =>
	expect(screen.getByTestId(testId)).toBeVisible({ timeout: LONG_TIMEOUT });

export const expectHidden = ({ screen }: Fixtures, testId: string) =>
	expect(screen.getByTestId(testId)).toBeHidden({ timeout: LONG_TIMEOUT });

export const expectAllVisible = async ({ screen }: Fixtures, testIds: readonly string[]) => {
	for (const testId of testIds) {
		await expect(screen.getByTestId(testId)).toBeVisible();
	}
};

export const expectAllHidden = async ({ screen }: Fixtures, testIds: readonly string[]) => {
	for (const testId of testIds) {
		await expect(screen.getByTestId(testId)).toBeHidden();
	}
};

export const expectTexts = async ({ screen }: Fixtures, texts: readonly string[]) => {
	for (const text of texts) {
		await expect(screen.getByText(text)).toBeVisible({ timeout: LONG_TIMEOUT });
	}
};

const dismissAndroidSystemDialogs = async ({ screen, platform }: Fixtures) => {
	if (platform !== 'android') {
		return;
	}
	await tapIfVisible(screen.getByText('Close app', { exact: false, visible: true }));
	await tapIfVisible(screen.getByText('Wait', { visible: true }));
};

export const hideKeyboard = async ({ platform, device, screen }: Fixtures, iosTapTarget?: Locator) => {
	if (platform === 'android') {
		await device.dismissKeyboard();
		return;
	}
	if (iosTapTarget) {
		await iosTapTarget.tap();
		return;
	}
	await screen.tapAt({ x: 4, y: 175 });
};

let androidAppInstalled = false;

const LEFTOVER_OPEN_PROMPT = /^Open in .Rocket\.Chat.\?$/;
const NO_APP_SESSION_ERRORS = ['APP_NOT_OPEN', 'ENGINE_FAILURE'];

const isLeftoverOpenPromptVisible = async (screen: Fixtures['screen']) => {
	try {
		return await isVisibleNow(screen.getByText(LEFTOVER_OPEN_PROMPT));
	} catch (error) {
		if (!NO_APP_SESSION_ERRORS.includes(errorCode(error) ?? '')) throw error;
		return false;
	}
};

const resetApp = async ({ app, device, platform, screen }: Fixtures) => {
	if (platform === 'ios') {
		if (await isLeftoverOpenPromptVisible(screen)) {
			await tapIfVisible(screen.getByRole('button', 'Cancel'));
		}
		await device.installApp(undefined, { reinstall: true });
		return;
	}
	if (!androidAppInstalled) {
		await device.installApp();
		androidAppInstalled = true;
	}
	await device.closeApp();
	await app.clearState();
};

export const launchApp = async (fixtures: Fixtures) => {
	await resetApp(fixtures);
	if (fixtures.platform === 'ios') {
		await fixtures.app.open();
	}
	await dismissAndroidSystemDialogs(fixtures);
	await expect(fixtures.screen.getByText('Add workspace')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const navigateToLogin = async ({ screen }: Fixtures, server = data.server) => {
	await fillWhenUncovered(screen.getByTestId('new-server-view-input'), server);
	await screen.getByText('Connect').tap();
	await expect(screen.getByTestId('workspace-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByText('Login')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByText('Login').tap();
	await expect(screen.getByTestId('login-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const submitLoginForm = async (fixtures: Fixtures, credentials: Credentials) => {
	const { screen } = fixtures;
	await fillWhenUncovered(screen.getByTestId('login-view-email'), credentials.username);
	await hideKeyboard(fixtures);
	await fillWhenUncovered(screen.getByTestId('login-view-password'), credentials.password);
	await hideKeyboard(fixtures);
	await screen.getByTestId('login-view-submit').tap();
};

export const loginWithForm = async (fixtures: Fixtures, credentials: Credentials) => {
	await submitLoginForm(fixtures, credentials);
	await expect(fixtures.screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

const COVERED_ERROR = 'is covered by another visible element';
const OFF_SCREEN_ERROR = 'is off-screen and not safe to press';
const NO_INPUT_AT_POINT_ERROR = 'no text input found at the provided coordinates';
const BEHIND_KEYBOARD_ERROR = 'is behind the visible keyboard';
const RETRYABLE_ACTION_ERRORS = [COVERED_ERROR, OFF_SCREEN_ERROR, NO_INPUT_AT_POINT_ERROR, BEHIND_KEYBOARD_ERROR];

const REFUSED_ACTION_CODES = ['NOT_ACTIONABLE', 'ENGINE_FAILURE'];

const isActionRefused = (error: unknown) => {
	const cause = (error as { cause?: unknown } | null)?.cause;
	return (
		REFUSED_ACTION_CODES.includes(errorCode(error) ?? '') ||
		(errorCode(error) === 'ACTION_FAILED' && errorCode(cause) === 'NOT_ACTIONABLE')
	);
};

const retryWhileUnreachable = async (action: () => Promise<unknown>, timeout: number) => {
	const deadline = Date.now() + timeout;
	for (;;) {
		try {
			await action();
			return;
		} catch (error) {
			const message = String(error);
			if (
				!isActionRefused(error) ||
				Date.now() > deadline ||
				!RETRYABLE_ACTION_ERRORS.some(retryable => message.includes(retryable))
			) {
				throw error;
			}
			await delay(500);
		}
	}
};

export const tapWhenUncovered = (locator: Locator, timeout = LONG_TIMEOUT) => retryWhileUnreachable(() => locator.tap(), timeout);

const UNSETTLED_CLEAR_ERROR = 'text entry verification failed';
const CLEAR_ATTEMPTS = 3;
const CLEAR_RETRY_DELAY = 1_000;

export const clearSettled = async (input: Locator) => {
	for (let attempt = 1; ; attempt++) {
		try {
			await input.clear();
			return;
		} catch (error) {
			if (!String(error).includes(UNSETTLED_CLEAR_ERROR) || attempt >= CLEAR_ATTEMPTS) {
				throw error;
			}
			await delay(CLEAR_RETRY_DELAY);
		}
	}
};

const UNCONFIRMED_FILL_ERRORS = [
	'could not confirm the typed text reached the field',
	'Android fill verification failed',
	UNSETTLED_CLEAR_ERROR
];
const UNCONFIRMED_FILL_ATTEMPTS = 3;

const holdsValue = async (locator: Locator, text: string) => {
	try {
		return (await locator.inputValue()) === text;
	} catch {
		return false;
	}
};

const fillConfirmed = async (locator: Locator, text: string) => {
	for (let attempt = 1; attempt < UNCONFIRMED_FILL_ATTEMPTS; attempt++) {
		try {
			await locator.fill(text);
			return;
		} catch (error) {
			if (!UNCONFIRMED_FILL_ERRORS.some(unconfirmed => String(error).includes(unconfirmed))) {
				throw error;
			}
			if (await holdsValue(locator, text)) {
				return;
			}
			await clearSettled(locator);
		}
	}
	await locator.pressSequentially(text);
};

export const fillWhenUncovered = (locator: Locator, text: string, timeout = LONG_TIMEOUT) =>
	retryWhileUnreachable(() => fillConfirmed(locator, text), timeout);

export const tapWhenVisible = async ({ screen }: Fixtures, testIdOrTarget: string | Locator) => {
	const target = typeof testIdOrTarget === 'string' ? screen.getByTestId(testIdOrTarget).first() : testIdOrTarget;
	await expect(target).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenUncovered(target);
};

const SEARCH_RESPONSE_TIMEOUT = 10_000;

export const typeUntilListed = async (type: () => Promise<void>, clear: () => Promise<void>, listed: Locator) => {
	await type();
	if (await succeeds(expect(listed).toBeVisible({ timeout: SEARCH_RESPONSE_TIMEOUT }))) {
		return;
	}
	await clear();
	await type();
};

const SCROLL_STALLED_ERROR = 'moved nothing';
const SCROLL_STALL_DELAY = 3_000;

export const scrollUntilLoaded = async ({ screen }: Fixtures, target: Locator, direction: 'up' | 'down') => {
	const deadline = Date.now() + LONG_TIMEOUT;
	for (;;) {
		try {
			await screen.scrollUntilVisible(target, { direction, timeout: LONG_TIMEOUT });
			return;
		} catch (error) {
			if (!String(error).includes(SCROLL_STALLED_ERROR) || Date.now() > deadline) {
				throw error;
			}
			await delay(SCROLL_STALL_DELAY);
		}
	}
};

const TAP_ATTEMPTS = 3;
const TAP_RESPONSE_TIMEOUT = 5_000;

export const tapUntilVisible = async (
	fixtures: Fixtures,
	target: Locator,
	expectedTestIdOrTarget: string | Locator,
	gesture: 'tap' | 'longPress' = 'tap'
) => {
	const expected =
		typeof expectedTestIdOrTarget === 'string' ? fixtures.screen.getByTestId(expectedTestIdOrTarget) : expectedTestIdOrTarget;
	const press = () => (gesture === 'tap' ? tapWhenUncovered(target) : target.longPress());
	await press();
	for (let attempt = 2; attempt <= TAP_ATTEMPTS; attempt += 1) {
		if (await succeeds(expect(expected).toBeVisible({ timeout: TAP_RESPONSE_TIMEOUT }))) {
			return;
		}
		if (await isVisibleNow(target)) {
			await press();
		}
	}
	await expect(expected).toBeVisible({ timeout: LONG_TIMEOUT });
};

const TAP_UNTIL_HIDDEN_TIMEOUT = 3_000;

export const scrollAndTap = async (container: Locator, target: Locator) => {
	await container.scrollUntilVisible(target, { timeout: LONG_TIMEOUT });
	await tapWhenUncovered(target);
};

const tapRegistered = async (loading: Locator, gone: Locator) => {
	const deadline = Date.now() + TAP_UNTIL_HIDDEN_TIMEOUT;
	while (Date.now() < deadline) {
		if ((await isVisibleNow(loading)) || !(await isVisibleNow(gone))) {
			return true;
		}
		await delay(FIRST_VISIBLE_POLL_INTERVAL);
	}
	return false;
};

export const tapUntilHidden = async ({ screen }: Fixtures, testId: string, goneTestId: string, attempts = 5) => {
	const gone = screen.getByTestId(goneTestId);
	const loading = screen.getByTestId('loading');
	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		await screen.getByTestId(testId).tap();
		if (await tapRegistered(loading, gone)) {
			break;
		}
	}
	await expect(gone).toBeHidden({ timeout: LONG_TIMEOUT });
};

const nearestTo = async (anchor: Locator, candidates: Locator) => {
	const anchorTop = (await anchor.boundingBox())?.y ?? 0;
	const distances = await Promise.all(
		(await candidates.all()).map(async candidate => {
			const box = await candidate.boundingBox();
			return box ? Math.abs(box.y - anchorTop) : Infinity;
		})
	);
	return candidates.nth(distances.indexOf(Math.min(...distances)));
};

export const confirmAlert = async ({ screen }: Fixtures, message: RegExp, button: RegExp) => {
	const alertMessage = screen.getByText(message).first();
	const buttons = screen.getByRole('button', button);
	await expect(alertMessage).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(buttons.first()).toBeVisible({ timeout: LONG_TIMEOUT });
	const tapConfirmButton = async () => {
		if (await isVisibleNow(alertMessage)) {
			await (await nearestTo(alertMessage, buttons)).tap();
		}
	};
	for (let attempt = 1; attempt < TAP_ATTEMPTS; attempt += 1) {
		await tapConfirmButton();
		if (await succeeds(expect(alertMessage).toBeHidden({ timeout: TAP_UNTIL_HIDDEN_TIMEOUT }))) {
			return;
		}
	}
	await tapConfirmButton();
	await expect(alertMessage).toBeHidden({ timeout: LONG_TIMEOUT });
};

const VALUE_SETTLE_TIMEOUT = 3_000;

const typeValue = async (input: Locator, value: string) => {
	await clearSettled(input);
	await input.pressSequentially(value);
};

export const fillSettled = async (input: Locator, value: string) => {
	await typeValue(input, value);
	try {
		await expect(input).toHaveValue(value, { timeout: VALUE_SETTLE_TIMEOUT });
	} catch (error) {
		if (errorCode(error) !== 'ASSERTION_FAILED') throw error;
		await typeValue(input, value);
		await expect(input).toHaveValue(value);
	}
};

export const replaceText = async (fixtures: Fixtures, testId: string, text: string) => {
	await typeValue(fixtures.screen.getByTestId(testId), text);
	await hideKeyboard(fixtures);
};

const OPEN_PROMPT_WAIT = 5_000;
const OPEN_PROMPT_POLL_INTERVAL = 500;

const acceptSystemAlert = async (device: Fixtures['device']) => {
	try {
		await device.alert('accept');
		return true;
	} catch (error) {
		const details = (error as { cause?: { details?: { runnerErrorCode?: string; reason?: string } } } | null)?.cause?.details;
		const alertMissing = details?.runnerErrorCode === 'ALERT_NOT_FOUND' || details?.reason === 'alert-not-found';
		const noOpenPrompt = /alert not found|alert accept button not found|overran its watchdog/.test(String(error));
		if (!alertMissing && !noOpenPrompt) throw error;
		return false;
	}
};

const URL_SCHEME_REGISTRATION_TIMEOUT = 30_000;
const OPEN_LINK_RETRY_DELAY = 2_000;

const isOpenLinkRejected = (error: unknown) => error instanceof Error && error.message.includes('failed to open');
const isOpenLinkUnanswered = (error: unknown) => error instanceof Error && error.message.includes('openurl did not answer');

const LATE_DELIVERY_WAIT = 10_000;

const openLinkWithRetry = async (device: Fixtures['device'], link: string, arrivals: readonly Locator[]) => {
	const deadline = Date.now() + URL_SCHEME_REGISTRATION_TIMEOUT;
	for (;;) {
		try {
			return await device.openLink(link);
		} catch (error) {
			if (isOpenLinkUnanswered(error)) {
				return;
			}
			if (Date.now() > deadline || !isOpenLinkRejected(error)) {
				throw error;
			}
			if (arrivals.length && (await succeeds(firstVisible(arrivals, LATE_DELIVERY_WAIT)))) {
				return;
			}
			await delay(OPEN_LINK_RETRY_DELAY);
		}
	}
};

const acceptOpenPrompt = async ({ device, screen }: Fixtures) => {
	const prompt = screen.getByRole('button', 'Open');
	if (await prompt.isVisible()) {
		await tapWhenUncovered(prompt);
		return true;
	}
	return acceptSystemAlert(device);
};

const waitForDeepLinkDestination = async (fixtures: Fixtures, destination: Locator) => {
	if (fixtures.platform !== 'ios') {
		await expect(destination).toBeVisible({ timeout: LONG_TIMEOUT });
		return;
	}
	await expect
		.poll(
			async () => {
				if (await destination.isVisible()) return true;
				await acceptOpenPrompt(fixtures);
				return destination.isVisible();
			},
			{ timeout: LONG_TIMEOUT }
		)
		.toBe(true);
};

const dismissDeepLinkPrompt = async (fixtures: Fixtures) => {
	const deadline = Date.now() + OPEN_PROMPT_WAIT;
	while (Date.now() < deadline) {
		if (await acceptOpenPrompt(fixtures)) {
			await expect(fixtures.screen.getByRole('button', 'Open')).toBeHidden({ timeout: OPEN_PROMPT_WAIT });
			return;
		}
		await delay(OPEN_PROMPT_POLL_INTERVAL);
	}
};

export const openDeepLink = async (fixtures: Fixtures, link: string, destination?: Locator) => {
	const openPrompt = fixtures.screen.getByRole('button', 'Open');
	await openLinkWithRetry(fixtures.device, link, destination ? [destination, openPrompt] : []);
	if (destination) {
		await waitForDeepLinkDestination(fixtures, destination);
		return;
	}
	if (fixtures.platform === 'ios') await dismissDeepLinkPrompt(fixtures);
};

export const PHOTOS_NOTIFICATIONS_PROMPT = '“Photos” Would Like to Send You Notifications';

const expectAddWorkspaceOverPhotosPrompt = async ({ device, screen }: Fixtures) => {
	const addWorkspace = screen.getByText('Add workspace');
	const photosPrompt = screen.getByText(PHOTOS_NOTIFICATIONS_PROMPT).first();
	if ((await succeeds(firstVisible([addWorkspace, photosPrompt]))) && (await isVisibleNow(photosPrompt))) {
		await device.alert('dismiss');
	}
	await expect(addWorkspace).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const loginWithDeepLink = async (fixtures: Fixtures, credentials: Credentials, server = data.server) => {
	await resetApp(fixtures);
	if (fixtures.platform === 'android') {
		await fixtures.device.closeApp();
	} else {
		await fixtures.app.open();
		await expectAddWorkspaceOverPhotosPrompt(fixtures);
	}
	const session = await login(credentials);
	await openDeepLink(
		fixtures,
		getDeepLink('auth', server, { userId: session.userId, token: session.authToken }),
		fixtures.screen.getByTestId('rooms-list-view')
	);
	await dismissAndroidSystemDialogs(fixtures);
	await expect(fixtures.screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expectServerConnected(fixtures);
	await firstVisible([
		fixtures.screen.getByTestId(/^rooms-list-view-item-/).first(),
		fixtures.screen.getByTestId('change-password-required-button')
	]);
};

export const navigateToRegister = async ({ screen }: Fixtures, server = data.server) => {
	await fillWhenUncovered(screen.getByTestId('new-server-view-input'), server);
	await screen.getByText('Connect').tap();
	await expect(screen.getByText('Create an account')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByText('Create an account').tap();
	await expect(screen.getByTestId('register-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

const BACK_BUTTON_TEST_IDS = ['custom-header-back', 'header-back', 'BackButton'];
const BACK_ATTEMPTS = 4;
const BACK_STEP_TIMEOUT = 10_000;

const IOS_BACK_LABEL = /^Back(, .*)?$/;

export const goBack = async ({ screen, platform }: Fixtures) => {
	const backButtons = BACK_BUTTON_TEST_IDS.map(testId => screen.getByTestId(testId, { visible: true }));
	if (platform === 'ios') {
		backButtons.push(screen.getByRole('button', { name: IOS_BACK_LABEL }).first());
	}
	for (let attempt = 1; ; attempt += 1) {
		try {
			await tapWhenUncovered(await firstVisible(backButtons, BACK_STEP_TIMEOUT));
			return;
		} catch (error) {
			if (errorCode(error) !== 'LOCATOR_NOT_FOUND' || attempt >= BACK_ATTEMPTS) throw error;
		}
	}
};

export const goBackUntil = async (
	fixtures: Fixtures,
	testIdOrTarget: string | Locator,
	state: 'visible' | 'hidden' = 'visible'
) => {
	const target = typeof testIdOrTarget === 'string' ? fixtures.screen.getByTestId(testIdOrTarget) : testIdOrTarget;
	const reached = (timeout: number) =>
		state === 'visible' ? expect(target).toBeVisible({ timeout }) : expect(target).toBeHidden({ timeout });
	for (let attempt = 0; attempt < BACK_ATTEMPTS; attempt += 1) {
		await goBack(fixtures);
		if (await succeeds(reached(BACK_STEP_TIMEOUT))) {
			return;
		}
	}
	await reached(LONG_TIMEOUT);
};

export const backToRoomsList = (fixtures: Fixtures) => goBackUntil(fixtures, 'rooms-list-view');

export const goBackThrough = async (fixtures: Fixtures, testIds: readonly string[]) => {
	for (const testId of testIds) {
		await goBackUntil(fixtures, testId);
	}
};

export const logout = async (fixtures: Fixtures) => {
	const { screen, platform } = fixtures;
	await tapIfVisible(headerItem(fixtures, 'profile-view-open-sidebar', 'Menu'));
	await tapIfVisible(headerItem(fixtures, 'rooms-list-view-sidebar', 'Menu'));
	if (platform === 'android') {
		await tapIfVisible(screen.getByTestId('android:id/autofill_save_no', { visible: true }));
	}
	await tapWhenVisible(fixtures, 'sidebar-settings');
	await screen.scrollUntilVisible(screen.getByTestId('settings-logout'));
	await tapWhenVisible(fixtures, 'settings-logout');
	await confirmAlert(fixtures, /You will be logged out of this application/, /^Logout$/i);
	await expect(screen.getByTestId('new-server-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const searchRoom = async (fixtures: Fixtures, room: string) => {
	const { screen } = fixtures;
	await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId(/^rooms-list-view-item-/).first()).toBeVisible({ timeout: LONG_TIMEOUT });
	await expectServerConnected(fixtures);
	const searchInput = headerSearchInput(fixtures, 'rooms-list-view-search-input');
	if (fixtures.platform === 'ios') {
		await tapWhenVisible(fixtures, searchInput);
	} else {
		const searchButton = screen.getByTestId('rooms-list-view-search').first();
		await expect(searchButton).toBeVisible({ timeout: LONG_TIMEOUT });
		await tapUntilVisible(fixtures, searchButton, 'rooms-list-view-search-input');
	}
	await fillWhenUncovered(searchInput, room);
	await expect(screen.getByTestId(`rooms-list-view-item-${room}`).first()).toBeVisible({ timeout: LONG_TIMEOUT });
};

const ROOM_OPEN_ATTEMPTS = 2;
const ROOM_OPEN_RESPONSE_TIMEOUT = 10_000;
const E2E_PASSWORD_CLOSE_BUTTON_TEST_IDS = ['e2e-save-your-password-view-close', 'e2e-enter-your-password-view-close'];

export const navigateToRoom = async (fixtures: Fixtures, room: string) => {
	const { screen } = fixtures;
	const roomItem = screen.getByTestId(`rooms-list-view-item-${room}`).first();
	const title = roomTitle(fixtures, room);
	const e2ePasswordCloseButtons = E2E_PASSWORD_CLOSE_BUTTON_TEST_IDS.map(testId => screen.getByTestId(testId));
	await expect(screen.getByTestId(/^rooms-list-view-item-/).first()).toBeVisible({ timeout: LONG_TIMEOUT });
	for (let attempt = 1; attempt < ROOM_OPEN_ATTEMPTS; attempt += 1) {
		await screen.scrollUntilVisible(roomItem);
		await roomItem.tap();
		const opened = await firstVisible([title, ...e2ePasswordCloseButtons], ROOM_OPEN_RESPONSE_TIMEOUT).catch(error => {
			if (errorCode(error) !== 'ASSERTION_FAILED') throw error;
			return undefined;
		});
		if (opened === title) {
			return;
		}
		await opened?.tap();
	}
	if (!(await isVisibleNow(title))) {
		await screen.scrollUntilVisible(roomItem);
		await roomItem.tap();
	}
	await expect(title).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const searchAndNavigateRoom = async (fixtures: Fixtures, room: string) => {
	await searchRoom(fixtures, room);
	await navigateToRoom(fixtures, room);
};

export const openRoomActions = async (fixtures: Fixtures) => {
	await expectVisible(fixtures, 'room-header');
	await fixtures.screen.getByTestId('room-header').first().tap();
	await expectVisible(fixtures, 'room-actions-view');
};

const SEND_RESPONSE_TIMEOUT = 10_000;

export const tapSend = async ({ screen }: Fixtures) => {
	const send = screen.getByTestId('message-composer-send');
	await expect(send).toBeVisible({ timeout: LONG_TIMEOUT });
	for (let attempt = 1; attempt < TAP_ATTEMPTS; attempt += 1) {
		await tapWhenUncovered(send);
		if (await succeeds(expect(send).toBeHidden({ timeout: SEND_RESPONSE_TIMEOUT }))) {
			return;
		}
	}
	await tapWhenUncovered(send);
	await expect(send).toBeHidden({ timeout: LONG_TIMEOUT });
};

export const sendMessage = async (fixtures: Fixtures, message: string, { inThread = false } = {}) => {
	const { screen } = fixtures;
	await fillWhenUncovered(screen.getByTestId(inThread ? 'message-composer-input-thread' : 'message-composer-input'), message);
	await tapSend(fixtures);
	await expect(screen.getByTestId(`message-content-${message}`)).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const openMessageActions = async (fixtures: Fixtures, message: string) => {
	await expectVisible(fixtures, `message-content-${message}`);
	await tapUntilVisible(fixtures, fixtures.screen.getByTestId(`message-content-${message}`), 'action-sheet', 'longPress');
};
