import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createUser, deleteCreatedUsers, findAppActionButton, getServerAppTranslation } from '~e2e/support/api';
import {
	escapeRegExp,
	fillSettled,
	headerItem,
	LONG_TIMEOUT,
	loginWithDeepLink,
	navigateToRoom,
	roomTitle
} from '~e2e/support/flows';
import { random } from '~e2e/support/random';

afterEach(deleteCreatedUsers);

test('creates and votes on a poll from the composer app action', { tags: ['test-9'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const room = await createRandomRoom(user);
	const pollButton = await findAppActionButton(user, 'messageBoxAction', 'message-box-create-poll');
	const pollLabel = await getServerAppTranslation(user, pollButton.appId, 'create_poll_button');
	const pollAction = screen.getByTestId(`message-composer-app-action-${pollButton.appId}/${pollButton.actionId}`);
	const question = `Poll ${random()}`;

	const appLabel = async (key: string) => {
		const translation = await getServerAppTranslation(user, pollButton.appId, key);
		return new RegExp(`^(${escapeRegExp(translation)}|${escapeRegExp(key)})$`);
	};
	const submitModal = headerItem(fixtures, 'submit-modal-uikit', await appLabel('poll_submit'));
	const closeModal = headerItem(fixtures, 'close-modal-uikit', await appLabel('poll_dismiss'));
	const voteButton = screen.getByRole('button', { name: await appLabel('poll_vote') }).first();

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
	await expect(submitModal).toBeVisible();
	await closeModal.tap();
	await expect(roomTitle(fixtures, room.name)).toBeVisible({ timeout: LONG_TIMEOUT });

	await openPollModal();
	await fillSettled(screen.getByTestId('uikit-input-question'), question);
	await fillSettled(screen.getByTestId('uikit-input-option-0'), 'Option A');
	await fillSettled(screen.getByTestId('uikit-input-option-1'), 'Option B');
	await submitModal.tap();
	await expect(submitModal).toBeHidden({ timeout: LONG_TIMEOUT });

	if (fixtures.platform === 'ios') {
		await expect(screen.getByRole('button', new RegExp(`^poll\\.bot .*${escapeRegExp(question)}`))).toBeVisible({
			timeout: LONG_TIMEOUT
		});
	} else {
		await expect(screen.getByText(question)).toBeVisible({ timeout: LONG_TIMEOUT });
		await expect(screen.getByText('Option A')).toBeVisible();
		await expect(screen.getByText('Option B')).toBeVisible();
	}
	await expect(screen.getByText(/0\.00% \(0\)/).first()).toBeVisible();

	await voteButton.tap();
	await expect(screen.getByText(/100\.00% \(1\)/)).toBeVisible({ timeout: LONG_TIMEOUT });
});
