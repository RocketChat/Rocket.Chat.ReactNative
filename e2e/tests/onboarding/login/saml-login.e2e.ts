import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { account, data } from '~e2e/support/data';
import { firstVisible, launchApp, navigateToLogin, LONG_TIMEOUT, fillWhenUncovered } from '~e2e/support/flows';
import { dismissChromeFirstRunPrompts, dismissPasswordManagerPrompt } from '~e2e/support/onboarding';

test('logs in with SAML', { tags: ['test-2'] }, async fixtures => {
	const { screen } = fixtures;
	await launchApp(fixtures);
	await navigateToLogin(fixtures, data.candidateServer);

	await expect(screen.getByText('Login on web')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByText('Login on web').tap();
	if (fixtures.platform === 'ios') {
		await fixtures.device.alert('accept');
	}
	await dismissChromeFirstRunPrompts(fixtures);
	await expect(screen.getByText('Email or username')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.scrollUntilVisible(screen.getByText('SAML'));
	await screen.getByText('SAML').tap();
	await expect(screen.getByText('Enter your username and password')).toBeVisible({ timeout: 10_000 });
	await fillWhenUncovered(screen.getByText('Username'), account.saml.username);
	await fillWhenUncovered(screen.getByText('Password'), account.saml.password);
	await screen.getByText('Login').tap();
	const roomsList = screen.getByTestId('rooms-list-view');
	const openInAppPrompt = screen.getByText(/Open this page in .Rocket\.Chat.\?/, { visible: true });
	const isIOS = fixtures.platform === 'ios';
	await dismissPasswordManagerPrompt(fixtures, isIOS ? [roomsList, openInAppPrompt] : [roomsList]);
	if (isIOS && (await firstVisible([openInAppPrompt, roomsList])) === openInAppPrompt) {
		await screen.getByRole('button', 'Open').tap();
	}
	await expect(roomsList).toBeVisible({ timeout: LONG_TIMEOUT });
});
