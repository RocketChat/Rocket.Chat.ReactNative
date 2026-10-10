import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers, sendMessage } from '~e2e/support/api';
import { loginWithDeepLink, navigateToRoom, LONG_TIMEOUT, expectVisible, scrollAndTap } from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

test('marks a message as unread', { tags: ['test-5'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const otherUser = await createUser();
	await sendMessage(otherUser, `@${user.username}`, 'message-mark-as-unread');
	await loginWithDeepLink(fixtures, user);
	await navigateToRoom(fixtures, otherUser.username);

	await expectVisible(fixtures, 'message-content-message-mark-as-unread');
	await screen.getByTestId('message-content-message-mark-as-unread').longPress();
	await expectVisible(fixtures, 'action-sheet');
	await scrollAndTap(screen.getByTestId('action-sheet'), screen.getByTestId('message-actions-mark-unread'));

	await expectVisible(fixtures, 'rooms-list-view');
	const roomItem = screen.getByTestId(`rooms-list-view-item-${otherUser.username}`);
	await expect(roomItem).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(roomItem.getByTestId('unread-badge-1')).toBeVisible({ timeout: LONG_TIMEOUT });
});
