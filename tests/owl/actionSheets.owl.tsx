/* eslint-env jest */

import { press, reload, takeScreenshot } from 'react-native-owl';

jest.setTimeout(180000);

// A single Owl build serves every device/orientation; the simulator/emulator and
// orientation are driven by CI, which exposes the leg via OWL_VARIANT so each
// baseline filename is unique (all iOS baselines share .owl/baseline/ios).
const variant = process.env.OWL_VARIANT || 'local';
const screenshotName = (name: string) => `${variant}-${name}`;
const isLandscape = variant.includes('landscape');

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// Real screens settle after mount (navigation push animation, DB/REST loading);
// the action sheet present animation also needs time. Be generous so the capture
// is of the fully settled state.
const SCREEN_SETTLE_DELAY = 6000;
const SHEET_PRESENT_DELAY = 6000;
const APP_READY_DELAY = 2000;
const ORIENTATION_DELAY = 3000;

// Each case opens the real screen, then its real action sheet. The trigger lives
// either in the navigation header (rooms list, directory) or the screen body
// (the list-picker rows).
const CASES = [
	{ name: 'servers-list', nav: 'owl-nav-rooms-list', trigger: 'rooms-list-header-servers-list-button' },
	{ name: 'directory-options', nav: 'owl-nav-directory', trigger: 'directory-view-filter' },
	{ name: 'media-auto-download', nav: 'owl-nav-media-auto-download', trigger: 'media-auto-download-image' },
	{
		name: 'user-notification-preferences',
		nav: 'owl-nav-user-notification-prefs',
		trigger: 'user-notification-preference-view-alert'
	}
];

describe('Action sheet safe-area spacing', () => {
	beforeEach(async () => {
		// Reload returns to the launcher with the previous sheet dismissed and the
		// app back in its default portrait orientation.
		await reload();
		await wait(APP_READY_DELAY);

		// Orientation is requested from JS on the launcher (works in CI/local with
		// no device rotation). Landscape variants rotate before navigating so the
		// pushed screen + native action sheet render in true landscape.
		await press(isLandscape ? 'owl-set-landscape' : 'owl-set-portrait');
		await wait(ORIENTATION_DELAY);
	});

	CASES.forEach(({ name, nav, trigger }) => {
		it(`matches the ${name} action sheet`, async () => {
			await press(nav);
			await wait(SCREEN_SETTLE_DELAY);

			await press(trigger);
			await wait(SHEET_PRESENT_DELAY);

			const screen = await takeScreenshot(screenshotName(`action-sheet-${name}`));

			expect(screen).toMatchBaseline();
		});
	});
});
