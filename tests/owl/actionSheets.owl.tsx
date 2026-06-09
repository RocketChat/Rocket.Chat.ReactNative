/* eslint-env jest */

import { press, reload, takeScreenshot } from 'react-native-owl';

jest.setTimeout(120000);

// Owl runs one build per fixture (OWL_FIXTURE is inlined at build time), but a
// single build serves every device/orientation. The simulator/emulator and the
// orientation are driven by CI, which exposes the leg via OWL_VARIANT so each
// baseline filename is unique (e.g. iphone16pro-landscape-action-sheet-...).
// All iOS baselines live under .owl/baseline/ios and Android under
// .owl/baseline/android, so the variant prefix is what keeps them from clashing.
const variant = process.env.OWL_VARIANT || 'local';
const screenshotName = (name: string) => `${variant}-${name}`;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// The action sheet present animation is intentionally slowed on CI
// (UIAnimationDragCoefficient), so wait generously for it to settle before
// capturing the screenshot.
const SHEET_PRESENT_DELAY = 6000;
const APP_READY_DELAY = 2000;

const SHEETS = [
	{ name: 'servers-list', trigger: 'owl-trigger-servers-list' },
	{ name: 'directory-options', trigger: 'owl-trigger-directory-options' },
	{ name: 'media-auto-download', trigger: 'owl-trigger-media-auto-download' },
	{ name: 'user-notification-preferences', trigger: 'owl-trigger-user-notification-prefs' }
];

describe('Action sheet safe-area spacing', () => {
	beforeEach(async () => {
		// Reload between sheets so the previous sheet is dismissed and the screen
		// is back to the trigger list. Device orientation is OS-level and persists
		// across reloads.
		await reload();
		await wait(APP_READY_DELAY);
	});

	SHEETS.forEach(({ name, trigger }) => {
		it(`matches the ${name} action sheet`, async () => {
			await press(trigger);
			await wait(SHEET_PRESENT_DELAY);

			const screen = await takeScreenshot(screenshotName(`action-sheet-${name}`));

			expect(screen).toMatchBaseline();
		});
	});
});
