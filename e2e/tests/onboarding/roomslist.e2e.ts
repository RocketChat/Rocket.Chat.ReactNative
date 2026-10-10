import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { loginWithDeepLink, searchRoom } from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

test('shows the rooms list and searches a room', { tags: ['test-8'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();

	await loginWithDeepLink(fixtures, user);
	await expect(screen.getByTestId('rooms-list-view-item-general')).toBeVisible();
	await expect(screen.getByTestId('rooms-list-view-create-channel')).toBeVisible();
	await expect(screen.getByTestId('rooms-list-view-sidebar')).toBeVisible();
	await searchRoom(fixtures, 'general');
});
