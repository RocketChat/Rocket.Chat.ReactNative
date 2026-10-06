import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers, getProfileInfo, login } from '~e2e/support/api';
import { hideKeyboard, loginWithDeepLink, type Fixtures, LONG_TIMEOUT, fillWhenUncovered } from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

const AVATAR_URL =
	'https://play-lh.googleusercontent.com/AMPmTxPV498lwVj3HsEJkvoUF6RurRcwYz2xbTCP7XndQdaWBmll4eSCcnwtbehUUw=w480-h960-rw';

const openChangeAvatar = async ({ screen }: Fixtures) => {
	const editButton = screen.getByTestId('avatar-edit-button');
	await expect(editButton).toBeVisible({ timeout: LONG_TIMEOUT });
	const editButtonBox = await editButton.boundingBox();
	if (!editButtonBox) {
		throw new Error('The avatar edit button has no bounds to tap');
	}
	await screen.tapAt({ x: editButtonBox.x + editButtonBox.width / 2, y: editButtonBox.y + editButtonBox.height / 2 });
	await expect(screen.getByTestId('change-avatar-view-submit')).toBeVisible({ timeout: LONG_TIMEOUT });
};

const saveAvatar = async ({ screen }: Fixtures) => {
	await expect(screen.getByTestId('change-avatar-view-submit')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('change-avatar-view-submit').tap();
	await expect(screen.getByTestId('profile-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

const expectAvatarChanged = async (userId: string, previousETag: string) => {
	await expect
		.poll(async () => (await getProfileInfo(userId)).avatarETag, { timeout: LONG_TIMEOUT, message: 'avatarETag never changed' })
		.not.toBe(previousETag);
};

const changeAvatarWith = async (fixtures: Fixtures, userId: string, pickAvatar: () => Promise<void>) => {
	const previousETag = (await getProfileInfo(userId)).avatarETag;
	await openChangeAvatar(fixtures);
	await pickAvatar();
	await saveAvatar(fixtures);
	await expectAvatarChanged(userId, previousETag);
};

const tapDiscardAlertButton = async ({ screen }: Fixtures, name: RegExp) => {
	await screen.getByTestId('header-back').tap();
	await expect(screen.getByText(/Discard changes\?/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByRole('button', { name }).last().tap();
};

test('changes the avatar', { tags: ['test-5'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const { userId } = await login(user);

	await loginWithDeepLink(fixtures, user);
	await screen.getByTestId('rooms-list-view-sidebar').tap();
	await expect(screen.getByTestId('sidebar-profile')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('sidebar-profile').tap();
	await expect(screen.getByTestId('profile-view')).toBeVisible({ timeout: LONG_TIMEOUT });

	await openChangeAvatar(fixtures);
	await expect(screen.getByTestId('change-avatar-view-avatar')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByTestId('reset-avatar-suggestion')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('reset-avatar-suggestion').tap({ position: { x: 8, y: 8 } });
	await tapDiscardAlertButton(fixtures, /^Cancel$/i);
	await tapDiscardAlertButton(fixtures, /^Discard$/i);
	await expect(screen.getByTestId('profile-view')).toBeVisible({ timeout: LONG_TIMEOUT });

	await changeAvatarWith(fixtures, userId, () => screen.getByText('Upload image').tap());

	await changeAvatarWith(fixtures, userId, () => screen.getByText('Take a photo').tap());

	await changeAvatarWith(fixtures, userId, async () => {
		await fillWhenUncovered(screen.getByTestId('change-avatar-view-avatar-url'), AVATAR_URL);
		await hideKeyboard(fixtures);
		await screen.getByText('Fetch image from URL').tap();
	});
});
