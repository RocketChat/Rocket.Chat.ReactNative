import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { adminCredentials } from '~e2e/support/api';
import { loginWithDeepLink, searchAndNavigateRoom, LONG_TIMEOUT, expectVisible, scrollUntilLoaded } from '~e2e/support/flows';

test('opens a room whose last message is a thread with more than 50 messages', { tags: ['test-3'] }, async fixtures => {
	const { screen } = fixtures;
	await loginWithDeepLink(fixtures, adminCredentials());
	await searchAndNavigateRoom(fixtures, 'maestro_test_load_threads');
	await expect(screen.getByText(/message 50/).first()).toBeVisible({ timeout: LONG_TIMEOUT });
	await expectVisible(fixtures, 'thread-count-55');
	await scrollUntilLoaded(fixtures, screen.getByTestId('message-content-message 1'), 'up');
});
