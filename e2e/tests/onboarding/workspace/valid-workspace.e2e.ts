import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { data } from '~e2e/support/data';
import { launchApp, LONG_TIMEOUT } from '~e2e/support/flows';

test('connects to a valid workspace', { tags: ['test-2'] }, async fixtures => {
	const { agent, screen } = fixtures;
	await launchApp(fixtures);
	await agent.act('connect to the workspace {server}', { params: { server: data.server } });
	await expect(screen.getByText('Login')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByText('Create an account')).toBeVisible({ timeout: LONG_TIMEOUT });
});
