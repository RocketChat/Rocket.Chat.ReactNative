import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { loginWithDeepLink, type Fixtures, LONG_TIMEOUT } from '~e2e/support/flows';
import {
	expectLabel,
	expectText,
	hideSoftKeyboardWithHardwareKeyboard,
	leaveTouchMode,
	moveFocusTo,
	pressKeys,
	pressKeyTimes,
	restoreKeyboardSettings,
	waitForFocus
} from '~e2e/support/keyboard';
import { delay } from '~e2e/support/timing';

const ANIMATION_MS = 1_000;

const expectAlertOptionsClosed = ({ screen }: Fixtures) =>
	expect(screen.getByTestId('action-sheet')).toBeHidden({ timeout: LONG_TIMEOUT });

afterEach(deleteCreatedUsers);
afterEach(restoreKeyboardSettings);

test(
	'navigates accessibility switches, theme radios and alert options with a hardware keyboard',
	{ tags: ['test-14'], platforms: ['android'], timeout: 600_000 },
	async fixtures => {
		const { screen } = fixtures;
		const user = await createUser();
		await hideSoftKeyboardWithHardwareKeyboard();
		await leaveTouchMode();
		await loginWithDeepLink(fixtures, user);

		await expect(screen.getByText('Save your encryption password')).toBeVisible({ timeout: LONG_TIMEOUT });
		await waitForFocus(fixtures, 'rooms-list-view-sidebar');
		await pressKeys('enter');
		await expect(screen.getByText(/^Accessibility & appearance$/i)).toBeVisible({ timeout: LONG_TIMEOUT });
		await pressKeys('left');
		await moveFocusTo(fixtures, 'sidebar-accessibility');
		await pressKeys('enter');

		await expect(screen.getByText('Theme')).toBeVisible({ timeout: LONG_TIMEOUT });
		await pressKeyTimes('down', 7);
		await pressKeys('up');
		await expectLabel(fixtures, 'Mentions with @ symbol unchecked');
		await pressKeys('enter');
		await expectLabel(fixtures, 'Mentions with @ symbol checked');
		await pressKeys('down');

		await pressKeyTimes('up', 4);
		await pressKeys('enter');
		await expect(screen.getByTestId('theme-view')).toBeVisible({ timeout: LONG_TIMEOUT });
		await pressKeys('down');
		await delay(ANIMATION_MS);
		await pressKeys('enter', 'down');
		await delay(ANIMATION_MS);
		await pressKeys('enter');

		await screen.getByTestId('custom-header-back').tap();
		await expect(screen.getByTestId('accessibility-view-list')).toBeVisible({ timeout: LONG_TIMEOUT });
		await expectText(fixtures, 'Show alerts as');
		await pressKeyTimes('down', 6);
		await pressKeys('enter');
		await expectLabel(fixtures, 'Toasts. Dismissed automatically. Checked');
		await expectLabel(fixtures, 'Dialogs. Require manual dismissal. Unchecked');
		await pressKeyTimes('down', 3);
		await pressKeys('enter');
		await expectAlertOptionsClosed(fixtures);
		await expectText(fixtures, 'Dialogs');
		await expectText(fixtures, 'Show alerts as');

		await pressKeyTimes('down', 5);
		await pressKeys('enter');
		await expectLabel(fixtures, 'Toasts. Dismissed automatically. Unchecked');
		await expectLabel(fixtures, 'Dialogs. Require manual dismissal. Checked');
		await pressKeyTimes('down', 2);
		await pressKeys('enter');
		await expectAlertOptionsClosed(fixtures);
		await expectText(fixtures, 'Toasts');
		await expectText(fixtures, 'Show alerts as');
	}
);
