import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { data } from '~e2e/support/data';
import { launchApp, LONG_TIMEOUT } from '~e2e/support/flows';
import {
	hideSoftKeyboardWithHardwareKeyboard,
	moveFocusTo,
	pressKeys,
	restoreKeyboardSettings,
	switchToSystemInputMethod,
	typeIntoFocusedField
} from '~e2e/support/keyboard';

afterEach(deleteCreatedUsers);
afterEach(restoreKeyboardSettings);

test(
	'logs in from onboarding with a hardware keyboard',
	{ tags: ['test-14'], platforms: ['android'], timeout: 600_000 },
	async fixtures => {
		const { screen } = fixtures;
		const user = await createUser();
		await hideSoftKeyboardWithHardwareKeyboard();
		await launchApp(fixtures);
		await switchToSystemInputMethod();

		await expect(screen.getByTestId('new-server-view')).toBeVisible({ timeout: LONG_TIMEOUT });
		await typeIntoFocusedField(data.server);
		await pressKeys('tab', 'enter');
		await expect(screen.getByText('Login')).toBeVisible({ timeout: LONG_TIMEOUT });
		await pressKeys('enter');

		await expect(screen.getByTestId('login-view')).toBeVisible({ timeout: LONG_TIMEOUT });
		await moveFocusTo(fixtures, 'login-view-email');
		await typeIntoFocusedField(user.email);
		await pressKeys('enter');
		await moveFocusTo(fixtures, 'login-view-password');
		await typeIntoFocusedField(user.password);
		await moveFocusTo(fixtures, 'login-view-submit');
		await pressKeys('enter');
		await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	}
);
