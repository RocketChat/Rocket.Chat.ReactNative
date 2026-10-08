import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers, deleteUserByUsername, getOwnEmail } from '~e2e/support/api';
import {
	expectAllVisible,
	firstVisible,
	replaceText,
	hideKeyboard,
	loginWithDeepLink,
	type Fixtures,
	LONG_TIMEOUT,
	fillWhenUncovered,
	tapWhenUncovered
} from '~e2e/support/flows';
import { random, type RandomUser } from '~e2e/support/random';
import { openProfile } from '~e2e/support/settings';
import { delay } from '~e2e/support/timing';

const PASSWORD_CHANGE_ATTEMPTS = 2;
const RATE_LIMIT_WINDOW = 61_000;

const renamedUsers: string[] = [];

afterEach(async () => {
	await deleteCreatedUsers();
	await Promise.all(renamedUsers.splice(0).map(deleteUserByUsername));
});

const editBasicInfo = async (fixtures: Fixtures, user: RandomUser) => {
	const { screen } = fixtures;
	const newUsername = `${user.username}username`;
	await replaceText(fixtures, 'profile-view-name', `${user.name}newname`);
	await replaceText(fixtures, 'profile-view-username', newUsername);
	await replaceText(fixtures, 'profile-view-nickname', `${user.username}newnickname`);
	await replaceText(fixtures, 'profile-view-bio', `${user.username}newbio`);
	const newEmail = `mobile+profileChangesNew${random()}@rocket.chat`;
	await screen.scrollUntilVisible(screen.getByTestId('profile-view-email'));
	await replaceText(fixtures, 'profile-view-email', newEmail);
	await screen.scrollUntilVisible(screen.getByTestId('profile-view-submit'));
	await screen.getByTestId('profile-view-submit').tap();
	await expect(screen.getByTestId('profile-view-enter-password-sheet-input')).toBeVisible({ timeout: LONG_TIMEOUT });
	await fillWhenUncovered(screen.getByTestId('profile-view-enter-password-sheet-input'), user.password);
	await tapWhenUncovered(screen.getByText('Save'));
	await expect(screen.getByTestId('profile-view-enter-password-sheet-input')).toBeHidden({ timeout: LONG_TIMEOUT });
	renamedUsers.push(newUsername);
	expect(await getOwnEmail({ username: newUsername, password: user.password })).toBe(newEmail);
};

const changePassword = async (fixtures: Fixtures, user: RandomUser) => {
	const { screen } = fixtures;
	const newPassword = `${user.password}new`;
	await screen.scrollUntilVisible(screen.getByTestId('profile-view-change-my-password-button'));
	await screen.getByTestId('profile-view-change-my-password-button').tap();
	await expect(screen.getByTestId('change-password-view-current-password')).toBeVisible({ timeout: LONG_TIMEOUT });
	await fillWhenUncovered(screen.getByTestId('change-password-view-current-password'), user.password);
	await hideKeyboard(fixtures);
	await fillWhenUncovered(screen.getByTestId('change-password-view-new-password'), newPassword);
	await hideKeyboard(fixtures);
	await fillWhenUncovered(screen.getByTestId('change-password-view-confirm-new-password'), newPassword);
	await hideKeyboard(fixtures);
	await screen.scrollUntilVisible(screen.getByTestId('change-password-view-set-new-password-button'));
	const rateLimited = screen.getByText(/too many requests/i);
	const profileView = screen.getByTestId('profile-view');
	for (let attempt = 1; attempt < PASSWORD_CHANGE_ATTEMPTS; attempt += 1) {
		await screen.getByTestId('change-password-view-set-new-password-button').tap();
		if ((await firstVisible([rateLimited, profileView])) === profileView) {
			return;
		}
		await screen.getByRole('button', { name: /^Ok$/i }).tap();
		await delay(RATE_LIMIT_WINDOW);
	}
	await screen.getByTestId('change-password-view-set-new-password-button').tap();
	await expect(profileView).toBeVisible({ timeout: LONG_TIMEOUT });
};

test('edits profile info and changes password', { tags: ['test-8'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();

	await loginWithDeepLink(fixtures, user);
	await openProfile(fixtures);
	await expectAllVisible(fixtures, [
		'profile-view-avatar',
		'avatar-edit-button',
		'profile-view-name',
		'profile-view-username',
		'profile-view-email'
	]);
	await screen.scrollUntilVisible(screen.getByTestId('profile-view-submit'));
	await screen.scrollUntilVisible(screen.getByTestId('profile-view-change-my-password-button'));
	await screen.scrollUntilVisible(screen.getByTestId('profile-view-name'), { direction: 'up' });

	await editBasicInfo(fixtures, user);
	await changePassword(fixtures, user);
});
