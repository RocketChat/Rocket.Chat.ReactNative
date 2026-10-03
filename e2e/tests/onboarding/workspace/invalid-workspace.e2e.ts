import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { launchApp } from '~e2e/support/flows';

test('rejects an invalid workspace URL', { tags: ['test-2'] }, async fixtures => {
	const { screen } = fixtures;
	await launchApp(fixtures);
	await screen.getByTestId('new-server-view-input').fill('https://invalid.workspace.url');
	await screen.getByText('Connect').tap();
	await expect(screen.getByText('Invalid URL')).toBeVisible();
});
