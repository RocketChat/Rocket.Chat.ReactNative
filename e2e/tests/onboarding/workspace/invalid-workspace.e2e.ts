import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { launchApp, fillWhenUncovered, withFixtures } from '~e2e/support/flows';

test(
	'rejects an invalid workspace URL',
	{ tags: ['test-8'] },
	withFixtures(async fixtures => {
		const { screen } = fixtures;
		await launchApp(fixtures);
		await fillWhenUncovered(screen.getByTestId('new-server-view-input'), 'https://invalid.workspace.url');
		await screen.getByText('Connect').tap();
		await expect(screen.getByText('Invalid URL')).toBeVisible();
	})
);
