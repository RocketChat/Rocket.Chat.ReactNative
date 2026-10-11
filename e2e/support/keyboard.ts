import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { expect, type Locator } from 'e2e';

import type { Fixtures } from './flows';
import { LONG_TIMEOUT, escapeRegExp, succeeds } from './flows';
import { delay } from './timing';

const runCommand = promisify(execFile);

const KEY_CODES = {
	up: 'KEYCODE_DPAD_UP',
	down: 'KEYCODE_DPAD_DOWN',
	left: 'KEYCODE_DPAD_LEFT',
	right: 'KEYCODE_DPAD_RIGHT',
	enter: 'KEYCODE_ENTER',
	tab: 'KEYCODE_TAB'
} as const;

type HardwareKey = keyof typeof KEY_CODES;

const KEY_PAUSE_MS = 1_000;
const FOCUS_ATTEMPTS = 10;
const FOCUS_CHECK_TIMEOUT = 1_000;

const androidSerial = () => process.env.E2E_ANDROID_DEVICE ?? 'emulator-5554';

const adbShell = (...command: string[]) => runCommand('adb', ['-s', androidSerial(), 'shell', ...command]);

export const pressKeys = async (...keys: HardwareKey[]) => {
	for (const key of keys) {
		await adbShell('input', 'keyevent', KEY_CODES[key]);
		await delay(KEY_PAUSE_MS);
	}
};

const quoteForShell = (text: string) => `'${text.replaceAll("'", "'\\''")}'`;

export const typeIntoFocusedField = async (text: string) => {
	await adbShell('input', 'text', quoteForShell(text.replaceAll(' ', '%s')));
	await delay(KEY_PAUSE_MS);
};

const TYPING_ATTEMPTS = 3;

const clearFocusedField = async () => {
	await adbShell('input', 'keycombination', 'KEYCODE_CTRL_LEFT', 'KEYCODE_A');
	await adbShell('input', 'keyevent', 'KEYCODE_DEL');
	await delay(KEY_PAUSE_MS);
};

export const typeIntoField = async (field: Locator, text: string) => {
	for (let attempt = 1; attempt <= TYPING_ATTEMPTS; attempt += 1) {
		if (attempt > 1) {
			await clearFocusedField();
		}
		await typeIntoFocusedField(text);
		if ((await field.inputValue()) === text) {
			return;
		}
	}
	await expect(field).toHaveValue(text);
};

const SOFT_KEYBOARD_SETTING = 'show_ime_with_hard_keyboard';
const UNSET_SETTING = 'null';
const AGENT_DEVICE_INPUT_METHOD_PACKAGE = 'com.callstack.agentdevice.imehelper/';

let originalSoftKeyboardSetting: string | undefined;
let originalInputMethod: string | undefined;

const readSecureSetting = async (name: string) => (await adbShell('settings', 'get', 'secure', name)).stdout.trim();

const writeSoftKeyboardSetting = (value: string) =>
	value === UNSET_SETTING
		? adbShell('settings', 'delete', 'secure', SOFT_KEYBOARD_SETTING)
		: adbShell('settings', 'put', 'secure', SOFT_KEYBOARD_SETTING, value);

export const hideSoftKeyboardWithHardwareKeyboard = async () => {
	originalSoftKeyboardSetting ??= await readSecureSetting(SOFT_KEYBOARD_SETTING);
	await writeSoftKeyboardSetting('0');
};

const systemInputMethod = async () => {
	const inputMethods = (await adbShell('ime', 'list', '-s')).stdout.split('\n').map(line => line.trim());
	const inputMethod = inputMethods.find(
		candidate => candidate !== '' && !candidate.startsWith(AGENT_DEVICE_INPUT_METHOD_PACKAGE)
	);
	if (inputMethod === undefined) {
		throw new Error('No system input method is enabled on the device');
	}
	return inputMethod;
};

export const switchToSystemInputMethod = async () => {
	originalInputMethod ??= await readSecureSetting('default_input_method');
	await adbShell('ime', 'set', await systemInputMethod());
};

export const restoreKeyboardSettings = async ({ platform }: Pick<Fixtures, 'platform'>) => {
	if (platform !== 'android') {
		return;
	}
	const softKeyboardSetting = originalSoftKeyboardSetting;
	const inputMethod = originalInputMethod;
	originalSoftKeyboardSetting = undefined;
	originalInputMethod = undefined;
	if (softKeyboardSetting !== undefined) {
		await writeSoftKeyboardSetting(softKeyboardSetting);
	}
	if (inputMethod !== undefined) {
		await adbShell('ime', 'set', inputMethod);
	}
};

export const leaveTouchMode = () => pressKeys('down');

export const pressKeyTimes = (key: HardwareKey, times: number) => pressKeys(...Array.from({ length: times }, () => key));

const isFocusedItself = ({ screen }: Fixtures, testId: string) =>
	succeeds(expect(screen.getByTestId(testId)).toBeFocused({ timeout: FOCUS_CHECK_TIMEOUT }));

const WRAPPER_CENTER_TOLERANCE = 4;

type Box = { x: number; y: number; width: number; height: number };

const sharesCenter = (wrapper: Box, target: Box) =>
	Math.abs(wrapper.x + wrapper.width / 2 - (target.x + target.width / 2)) <= WRAPPER_CENTER_TOLERANCE &&
	Math.abs(wrapper.y + wrapper.height / 2 - (target.y + target.height / 2)) <= WRAPPER_CENTER_TOLERANCE;

const isInsideFocusedWrapper = async ({ device, screen }: Fixtures, testId: string) => {
	const target = screen.getByTestId(testId);
	const focusedWrapper = device.locator('focused=true').filter({ has: target });
	if ((await focusedWrapper.count()) === 0) {
		return false;
	}
	const [wrapperBox, targetBox] = await Promise.all([focusedWrapper.first().boundingBox(), target.boundingBox()]);
	return !!wrapperBox && !!targetBox && sharesCenter(wrapperBox, targetBox);
};

const isFocused = async (fixtures: Fixtures, testId: string) =>
	(await isFocusedItself(fixtures, testId)) || isInsideFocusedWrapper(fixtures, testId);

export const moveFocusTo = async (fixtures: Fixtures, testId: string, key: HardwareKey = 'down') => {
	for (let attempt = 0; attempt <= FOCUS_ATTEMPTS; attempt += 1) {
		if (await isFocused(fixtures, testId)) {
			return;
		}
		if (attempt < FOCUS_ATTEMPTS) {
			await pressKeys(key);
		}
	}
	await expect(fixtures.screen.getByTestId(testId)).toBeFocused();
};

export const waitForFocus = async (fixtures: Fixtures, testId: string) => {
	for (let attempt = 0; attempt < FOCUS_ATTEMPTS; attempt += 1) {
		if (await isFocused(fixtures, testId)) {
			return;
		}
	}
	await expect(fixtures.screen.getByTestId(testId)).toBeFocused();
};

const caseInsensitiveExact = (text: string) => new RegExp(`^${escapeRegExp(text)}$`, 'i');

export const expectLabel = async ({ screen }: Fixtures, label: string) => {
	await expect(screen.getByLabel(caseInsensitiveExact(label))).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const expectText = async ({ screen }: Fixtures, text: string) => {
	await expect(screen.getByText(text, { visible: true }).first()).toBeVisible({ timeout: LONG_TIMEOUT });
};
