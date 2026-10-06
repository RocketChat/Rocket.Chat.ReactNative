import type { Locator, TestFixtures } from 'e2e';
import type { Device } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { getDeepLink, login, type Credentials } from './api';
import { data } from './data';
import { delay } from './timing';

export type Fixtures = TestFixtures & { device: Device };

export const LONG_TIMEOUT = 60_000;

export const succeeds = (assertion: Promise<unknown>) =>
	assertion.then(
		() => true,
		() => false
	);

export const isVisibleNow = async (locator: Locator) => {
	try {
		return await locator.isVisible();
	} catch {
		return false;
	}
};

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
	throw new Error(NONE_VISIBLE_ERROR);
};

export const tapIfVisible = async (target: Locator) => {
	if (await isVisibleNow(target)) {
		await tapWhenUncovered(target);
	}
};

export const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

const resetApp = async ({ app, device, platform }: Fixtures) => {
	if (platform === 'ios') {
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
	await screen.getByTestId('new-server-view-input').fill(server);
	await screen.getByText('Connect').tap();
	await expect(screen.getByTestId('workspace-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByText('Login')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByText('Login').tap();
	await expect(screen.getByTestId('login-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const submitLoginForm = async (fixtures: Fixtures, credentials: Credentials) => {
	const { screen } = fixtures;
	await screen.getByTestId('login-view-email').fill(credentials.username);
	await hideKeyboard(fixtures);
	await screen.getByTestId('login-view-password').fill(credentials.password);
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
const RETRYABLE_ACTION_ERRORS = [COVERED_ERROR, OFF_SCREEN_ERROR, NO_INPUT_AT_POINT_ERROR];

const retryWhileUnreachable = async (action: () => Promise<unknown>, timeout: number) => {
	const deadline = Date.now() + timeout;
	for (;;) {
		try {
			await action();
			return;
		} catch (error) {
			const message = String(error);
			if (Date.now() > deadline || !RETRYABLE_ACTION_ERRORS.some(retryable => message.includes(retryable))) {
				throw error;
			}
			await delay(500);
		}
	}
};

export const tapWhenUncovered = (locator: Locator, timeout = LONG_TIMEOUT) => retryWhileUnreachable(() => locator.tap(), timeout);

export const fillWhenUncovered = (locator: Locator, text: string, timeout = LONG_TIMEOUT) =>
	retryWhileUnreachable(() => locator.fill(text), timeout);

export const tapWhenVisible = async ({ screen }: Fixtures, testIdOrTarget: string | Locator) => {
	const target = typeof testIdOrTarget === 'string' ? screen.getByTestId(testIdOrTarget).first() : testIdOrTarget;
	await expect(target).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenUncovered(target);
};

const TAP_ATTEMPTS = 3;
const TAP_RESPONSE_TIMEOUT = 5_000;

export const tapUntilVisible = async (
	fixtures: Fixtures,
	target: Locator,
	expectedTestId: string,
	gesture: 'tap' | 'longPress' = 'tap'
) => {
	const expected = fixtures.screen.getByTestId(expectedTestId);
	for (let attempt = 1; attempt < TAP_ATTEMPTS; attempt += 1) {
		await (gesture === 'tap' ? tapWhenUncovered(target) : target.longPress());
		if (await succeeds(expect(expected).toBeVisible({ timeout: TAP_RESPONSE_TIMEOUT }))) {
			return;
		}
	}
	await (gesture === 'tap' ? tapWhenUncovered(target) : target.longPress());
	await expect(expected).toBeVisible({ timeout: LONG_TIMEOUT });
};

const TAP_UNTIL_HIDDEN_TIMEOUT = 3_000;

export const tapUntilHidden = async ({ screen }: Fixtures, testId: string, goneTestId: string, attempts = 5) => {
	const gone = screen.getByTestId(goneTestId);
	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		await screen.getByTestId(testId).tap();
		try {
			await gone.waitFor({ state: 'hidden', timeout: TAP_UNTIL_HIDDEN_TIMEOUT });
			return;
		} catch {}
	}
	await expect(gone).toBeHidden();
};

const isEngineFailure = (error: unknown) => (error as { code?: string } | null)?.code === 'ENGINE_FAILURE';

const tapToleratingRunnerFailure = async (target: Locator) => {
	try {
		await target.tap();
	} catch (error) {
		if (!isEngineFailure(error)) {
			throw error;
		}
	}
};

export const confirmAlert = async ({ screen }: Fixtures, message: RegExp, button: RegExp) => {
	await expect(screen.getByText(message).first()).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByRole('button', button).last().tap();
};

const VALUE_SETTLE_TIMEOUT = 3_000;

const typeValue = async (input: Locator, value: string) => {
	await input.clear();
	await input.pressSequentially(value);
};

export const fillSettled = async (input: Locator, value: string) => {
	await typeValue(input, value);
	try {
		await expect(input).toHaveValue(value, { timeout: VALUE_SETTLE_TIMEOUT });
	} catch {
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
	} catch {
		return false;
	}
};

export const openDeepLink = async ({ device, screen, platform }: Fixtures, link: string, destination?: Locator) => {
	await device.openLink(link);
	if (platform !== 'ios') {
		return;
	}
	const openPrompt = screen.getByRole('button', 'Open');
	const deadline = Date.now() + (destination ? LONG_TIMEOUT : OPEN_PROMPT_WAIT);
	while (Date.now() < deadline) {
		if (await isVisibleNow(openPrompt)) {
			await tapIfVisible(openPrompt);
			if (!destination && (await succeeds(expect(openPrompt).toBeHidden({ timeout: OPEN_PROMPT_WAIT })))) {
				return;
			}
		} else if (destination && (await isVisibleNow(destination))) {
			return;
		} else if ((await acceptSystemAlert(device)) && !destination) {
			return;
		}
		await delay(OPEN_PROMPT_POLL_INTERVAL);
	}
};

export const loginWithDeepLink = async (fixtures: Fixtures, credentials: Credentials, server = data.server) => {
	await resetApp(fixtures);
	if (fixtures.platform === 'android') {
		await fixtures.device.closeApp();
	}
	const session = await login(credentials);
	await openDeepLink(
		fixtures,
		getDeepLink('auth', server, { userId: session.userId, token: session.authToken }),
		fixtures.screen.getByTestId('rooms-list-view')
	);
	await dismissAndroidSystemDialogs(fixtures);
	await expect(fixtures.screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const navigateToRegister = async ({ screen }: Fixtures, server = data.server) => {
	await screen.getByTestId('new-server-view-input').fill(server);
	await screen.getByText('Connect').tap();
	await expect(screen.getByText('Create an account')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByText('Create an account').tap();
	await expect(screen.getByTestId('register-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

const BACK_BUTTON_TEST_IDS = ['custom-header-back', 'header-back'];
const BACK_ATTEMPTS = 4;
const BACK_STEP_TIMEOUT = 10_000;

export const goBack = async ({ screen }: Fixtures) => {
	const backButtons = BACK_BUTTON_TEST_IDS.map(testId => screen.getByTestId(testId, { visible: true }));
	await tapToleratingRunnerFailure(await firstVisible(backButtons, BACK_STEP_TIMEOUT));
};

export const goBackUntil = async (fixtures: Fixtures, testId: string, state: 'visible' | 'hidden' = 'visible') => {
	const target = fixtures.screen.getByTestId(testId);
	const reached = (timeout: number) =>
		state === 'visible' ? expect(target).toBeVisible({ timeout }) : expect(target).toBeHidden({ timeout });
	for (let attempt = 0; attempt < BACK_ATTEMPTS; attempt += 1) {
		await succeeds(goBack(fixtures));
		if (await succeeds(reached(BACK_STEP_TIMEOUT))) {
			return;
		}
	}
	await reached(LONG_TIMEOUT);
};

export const backToRoomsList = (fixtures: Fixtures) => goBackUntil(fixtures, 'rooms-list-view');

export const logout = async (fixtures: Fixtures) => {
	const { screen, platform } = fixtures;
	await tapIfVisible(screen.getByTestId('profile-view-open-sidebar', { visible: true }));
	await tapIfVisible(screen.getByTestId('rooms-list-view-sidebar', { visible: true }));
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
	const searchButton = screen.getByTestId('rooms-list-view-search').first();
	await expect(searchButton).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapUntilVisible(fixtures, searchButton, 'rooms-list-view-search-input');
	await screen.getByTestId('rooms-list-view-search-input').fill(room);
	await expect(screen.getByTestId(`rooms-list-view-item-${room}`).first()).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const navigateToRoom = async ({ screen }: Fixtures, room: string) => {
	await screen.scrollUntilVisible(screen.getByTestId(`rooms-list-view-item-${room}`).first());
	await screen.getByTestId(`rooms-list-view-item-${room}`).first().tap();
	await expect(screen.getByTestId(`room-view-title-${room}`)).toBeVisible({ timeout: LONG_TIMEOUT });
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

export const navigateToRoomActions = async (fixtures: Fixtures, room: string) => {
	if (!(await isVisibleNow(fixtures.screen.getByTestId('room-view')))) {
		await searchAndNavigateRoom(fixtures, room);
	}
	await expectVisible(fixtures, 'room-view');
	await openRoomActions(fixtures);
};

export const sendMessage = async ({ screen }: Fixtures, message: string, { inThread = false } = {}) => {
	await fillWhenUncovered(screen.getByTestId(inThread ? 'message-composer-input-thread' : 'message-composer-input'), message);
	await expect(screen.getByTestId('message-composer-send')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('message-composer-send').tap();
	await expect(screen.getByTestId(`message-content-${message}`)).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const openMessageActions = async (fixtures: Fixtures, message: string) => {
	await expectVisible(fixtures, `message-content-${message}`);
	await tapUntilVisible(fixtures, fixtures.screen.getByTestId(`message-content-${message}`), 'action-sheet', 'longPress');
};
