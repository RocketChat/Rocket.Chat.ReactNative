import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { loginWithDeepLink, LONG_TIMEOUT } from '~e2e/support/flows';
import { randomTeamName } from '~e2e/support/random';
import { createTeam } from '~e2e/support/teams';

afterEach(deleteCreatedUsers);

test('creates and deletes a team', { tags: ['test-4'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	const teamName = randomTeamName();

	await loginWithDeepLink(fixtures, user);
	await createTeam(fixtures, teamName);
	await expect(screen.getByTestId('room-view-messages')).toBeVisible();

	await screen.getByTestId('room-header').first().tap();
	await screen.getByTestId('room-actions-info').tap();
	await screen.getByTestId('room-info-view-edit-button').tap();
	await screen.scrollUntilVisible(screen.getByTestId('room-info-edit-view-delete'));
	await screen.getByTestId('room-info-edit-view-delete').tap();
	await screen.getByRole('button', { name: /^Yes, delete it!$/i }).tap();
	await expect(screen.getByTestId(`rooms-list-view-item-${teamName}`)).toBeHidden({ timeout: LONG_TIMEOUT });
});
