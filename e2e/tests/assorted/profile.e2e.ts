import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers, deleteUserByUsername } from '~e2e/support/api';
import {
	expectAllVisible,
	firstVisible,
	replaceText,
	hideKeyboard,
	loginWithDeepLink,
	type Fixtures,
	LONG_TIMEOUT,
	fillWhenUncovered
} from '~e2e/support/flows';
import { random, type RandomUser } from '~e2e/support/random';
import { openProfile } from '~e2e/support/settings';

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
	await screen.scrollUntilVisible(screen.getByTestId('profile-view-email'));
	await replaceText(fixtures, 'profile-view-email', `mobile+profileChangesNew${random()}@rocket.chat`);
	await screen.scrollUntilVisible(screen.getByTestId('profile-view-submit'));
	await screen.getByTestId('profile-view-submit').tap();
	await expect(screen.getByTestId('profile-view-enter-password-sheet-input')).toBeVisible({ timeout: LONG_TIMEOUT });
	await fillWhenUncovered(screen.getByTestId('profile-view-enter-password-sheet-input'), user.password);
	await screen.getByText('Save').tap();
	await expect(screen.getByTestId('profile-view-enter-password-sheet-input')).toBeHidden({ timeout: LONG_TIMEOUT });
	renamedUsers.push(newUsername);
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
	await screen.getByTestId('change-password-view-set-new-password-button').tap();
	const ok = screen.getByRole('button', { name: /^Ok$/i });
	const profileView = screen.getByTestId('profile-view');
	if ((await firstVisible([ok, profileView])) === ok) {
		await ok.tap();
		await screen.getByTestId('change-password-view-cancel-button').tap();
	}
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
