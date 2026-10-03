import { afterEach, test } from '@e2e-dev/mobile';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { loginWithDeepLink, tapWhenVisible, expectVisible } from '~e2e/support/flows';

afterEach(deleteCreatedUsers);

test('fully renders the workspaces action sheet on small screens', { tags: ['test-14'], platforms: ['ios'] }, async fixtures => {
	const user = await createUser();
	await loginWithDeepLink(fixtures, user);

	await tapWhenVisible(fixtures, 'rooms-list-header-servers-list-button');
	await expectVisible(fixtures, 'action-sheet');
	await expectVisible(fixtures, 'rooms-list-header-servers-list');
	await tapWhenVisible(fixtures, 'rooms-list-header-server-add');
	await expectVisible(fixtures, 'new-server-view');
});
