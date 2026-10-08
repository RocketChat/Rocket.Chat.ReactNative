import { test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { account, data } from '~e2e/support/data';
import { firstVisible, launchApp, navigateToLogin, LONG_TIMEOUT, fillWhenUncovered, type Fixtures } from '~e2e/support/flows';
import { dismissBrowserFirstRunPrompts, dismissPasswordManagerPrompt } from '~e2e/support/onboarding';

const SAFARI_APP = 'com.apple.mobilesafari';
const APP_SWITCH_ATTEMPTS = 3;
const APP_SWITCH_TIMEOUT_ERROR = 'xcrun timed out';

const switchToApp = async ({ device }: Fixtures, app: string) => {
	for (let attempt = 1; ; attempt++) {
		try {
			return await device.openApp(app);
		} catch (error) {
			if (attempt >= APP_SWITCH_ATTEMPTS || !String(error).includes(APP_SWITCH_TIMEOUT_ERROR)) {
				throw error;
			}
		}
	}
};

const samlControl = ({ screen, platform }: Fixtures, role: 'textbox' | 'button', label: string) =>
	platform === 'ios' ? screen.getByRole(role, label) : screen.getByText(label);

const fillSamlField = async (fixtures: Fixtures, label: string, text: string) => {
	const field = samlControl(fixtures, 'textbox', label);
	if (fixtures.platform === 'ios') {
		await field.tap();
		await field.pressSequentially(text);
		return;
	}
	await fillWhenUncovered(field, text);
};

test('logs in with SAML', { tags: ['test-2'] }, async fixtures => {
	const { device, screen } = fixtures;
	const isIOS = fixtures.platform === 'ios';
	await launchApp(fixtures);
	await navigateToLogin(fixtures, data.candidateServer);
	const rocketChatApp = await device.foregroundApp();

	await expect(screen.getByText('Login on web')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByText('Login on web').tap();
	if (isIOS) {
		await switchToApp(fixtures, SAFARI_APP);
	}
	await dismissBrowserFirstRunPrompts(fixtures, screen.getByText('Email or username').first());
	await screen.scrollUntilVisible(screen.getByText('SAML'));
	await screen.swipe({ direction: 'down' });
	await screen.getByText('SAML').tap();
	const samlForm = screen.getByText('Enter your username and password');
	const roomsList = screen.getByTestId('rooms-list-view');
	const openInAppPrompt = screen.getByText(/Open this page in .Rocket\.Chat.\?/, { visible: true });
	if ((await firstVisible([samlForm, openInAppPrompt, roomsList])) === samlForm) {
		await fillSamlField(fixtures, 'Username', account.saml.username);
		await fillSamlField(fixtures, 'Password', account.saml.password);
		await samlControl(fixtures, 'button', 'Login').tap();
		await dismissPasswordManagerPrompt(fixtures, isIOS ? [roomsList, openInAppPrompt] : [roomsList]);
	}
	if (isIOS && (await firstVisible([openInAppPrompt, roomsList])) === openInAppPrompt) {
		await screen.getByRole('button', 'Open').first().tap();
	}
	if (isIOS) {
		await switchToApp(fixtures, rocketChatApp.bundleId ?? rocketChatApp.name);
	}
	await expect(roomsList).toBeVisible({ timeout: LONG_TIMEOUT });
});
