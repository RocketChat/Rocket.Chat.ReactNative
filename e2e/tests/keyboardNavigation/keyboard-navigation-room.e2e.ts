import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers } from '~e2e/support/api';
import { loginWithDeepLink, LONG_TIMEOUT } from '~e2e/support/flows';
import {
	hideSoftKeyboardWithHardwareKeyboard,
	leaveTouchMode,
	moveFocusTo,
	pressKeys,
	restoreKeyboardSettings,
	typeIntoFocusedField,
	waitForFocus
} from '~e2e/support/keyboard';
import { random } from '~e2e/support/random';

afterEach(deleteCreatedUsers);
afterEach(restoreKeyboardSettings);

test(
	'sends a message and an emoji with a hardware keyboard',
	{ tags: ['test-9'], platforms: ['android'], timeout: 600_000 },
	async fixtures => {
		const { screen } = fixtures;
		const user = await createUser();
		const room = await createRandomRoom(user);
		const message = `keyboard-room-${random(6)}`;

		await hideSoftKeyboardWithHardwareKeyboard();
		await leaveTouchMode();
		await loginWithDeepLink(fixtures, user);
		await expect(screen.getByText(room.name)).toBeVisible({ timeout: LONG_TIMEOUT });
		await expect(screen.getByText('Save your encryption password')).toBeVisible({ timeout: LONG_TIMEOUT });
		await waitForFocus(fixtures, 'rooms-list-view-sidebar');
		await pressKeys('right', 'right', 'down', 'down', 'enter');

		await expect(screen.getByTestId('message-composer-input')).toBeVisible({ timeout: LONG_TIMEOUT });
		await moveFocusTo(fixtures, 'message-composer-input');
		await typeIntoFocusedField(message);
		await pressKeys('down', 'right', 'enter');
		await expect(screen.getByTestId(`message-content-${message}`)).toBeVisible({ timeout: LONG_TIMEOUT });

		await pressKeys('up', 'down', 'right', 'enter');
		await expect(screen.getByTestId('message-composer-close-emoji')).toBeVisible({ timeout: LONG_TIMEOUT });
		await pressKeys('down', 'down', 'down');
		await moveFocusTo(fixtures, 'emoji-picker-tab-emoji', 'right');
		await pressKeys('enter');
		await pressKeys('down', 'right');
		await moveFocusTo(fixtures, 'emoji-grinning', 'up');
		await pressKeys('enter');
		await moveFocusTo(fixtures, 'message-composer-send', 'up');
		await pressKeys('enter');
		await expect(screen.getByTestId('message-content-😀')).toBeVisible({ timeout: LONG_TIMEOUT });
	}
);
