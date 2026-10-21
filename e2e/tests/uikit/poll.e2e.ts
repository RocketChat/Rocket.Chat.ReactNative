import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers, findAppActionButton, getServerAppTranslation } from '~e2e/support/api';
import { fillSettled, LONG_TIMEOUT, loginWithDeepLink, navigateToRoom, roomTitle } from '~e2e/support/flows';
import { random } from '~e2e/support/random';

afterEach(deleteCreatedUsers);

test('creates and votes on a poll from the composer app action', { tags: ['test-9'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const room = await createRandomRoom(user);
	const pollButton = await findAppActionButton(user, 'messageBoxAction', 'message-box-create-poll');
	const pollLabel = await getServerAppTranslation(user, pollButton.appId, 'create_poll_button');
	const voteLabel = await getServerAppTranslation(user, pollButton.appId, 'poll_vote');
	const pollAction = screen.getByTestId(`message-composer-app-action-${pollButton.appId}/${pollButton.actionId}`);
	const question = `Poll ${random()}`;

	const openPollModal = async () => {
		await screen.getByTestId('message-composer-actions').tap();
		await expect(screen.getByTestId('action-sheet')).toBeVisible({ timeout: LONG_TIMEOUT });
		await expect(pollAction).toBeVisible({ timeout: LONG_TIMEOUT });
		await expect(screen.getByText(pollLabel)).toBeVisible();
		await pollAction.tap();
		await expect(screen.getByTestId('uikit-input-question')).toBeVisible({ timeout: LONG_TIMEOUT });
	};

	await loginWithDeepLink(fixtures, user);
	await navigateToRoom(fixtures, room.name);
	await expect(screen.getByTestId('message-composer-actions')).toBeVisible({ timeout: LONG_TIMEOUT });

	await openPollModal();
	await expect(screen.getByTestId('submit-modal-uikit')).toBeVisible();
	await screen.getByTestId('close-modal-uikit').tap();
	await expect(roomTitle(fixtures, room.name)).toBeVisible({ timeout: LONG_TIMEOUT });

	await openPollModal();
	await fillSettled(screen.getByTestId('uikit-input-question'), question);
	await fillSettled(screen.getByTestId('uikit-input-option-0'), 'Option A');
	await fillSettled(screen.getByTestId('uikit-input-option-1'), 'Option B');
	await screen.getByTestId('submit-modal-uikit').tap();
	await expect(screen.getByTestId('submit-modal-uikit')).toBeHidden({ timeout: LONG_TIMEOUT });

	await expect(screen.getByText(question)).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByText('Option A')).toBeVisible();
	await expect(screen.getByText('Option B')).toBeVisible();
	await expect(screen.getByText(/0\.00% \(0\)/).first()).toBeVisible();

	await screen.getByText(voteLabel).first().tap();
	await expect(screen.getByText(/100\.00% \(1\)/)).toBeVisible({ timeout: LONG_TIMEOUT });
});
