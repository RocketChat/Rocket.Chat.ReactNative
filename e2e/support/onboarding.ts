import type { Locator } from 'e2e';
import { expect } from 'e2e';

import { getDeepLink, login, type Credentials } from './api';
import { data } from './data';
import { firstVisible, hideKeyboard, openDeepLink, type Fixtures, LONG_TIMEOUT, tapIfVisible, tapWhenVisible } from './flows';
import { randomUser, type RandomUser } from './random';

export const fillRegisterForm = async (fixtures: Fixtures, user: RandomUser) => {
	const { screen } = fixtures;
	const fields = [
		['register-view-name', user.name],
		['register-view-username', user.username],
		['register-view-email', user.email],
		['register-view-password', user.password],
		['register-view-confirm-password', user.password]
	] as const;
	for (const [testId, value] of fields) {
		await screen.scrollUntilVisible(screen.getByTestId(testId));
		await screen.getByTestId(testId).pressSequentially(value);
		await hideKeyboard(fixtures);
	}
	await screen.scrollUntilVisible(screen.getByTestId('register-view-submit'));
	await screen.getByTestId('register-view-submit').tap();
};

export const registerAccount = async (fixtures: Fixtures) => {
	const user = randomUser();
	await fillRegisterForm(fixtures, user);
	await expect(fixtures.screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	return user;
};

export const registerOnWorkspace = async (fixtures: Fixtures) => {
	await tapWhenVisible(fixtures, 'workspace-view-register');
	await expect(fixtures.screen.getByTestId('register-view-name')).toBeVisible({ timeout: LONG_TIMEOUT });
	return registerAccount(fixtures);
};

const CHROME_FIRST_RUN_PROMPTS = [
	{ prompt: /Add account to device/, dismiss: 'Use without an account' },
	{ prompt: /Chrome notifications make things easier/, dismiss: 'No thanks' },
	{ prompt: /wants to send you notifications/, dismiss: 'Block' }
] as const;

export const dismissChromeFirstRunPrompts = async (fixtures: Fixtures, destination: Locator) => {
	const { screen } = fixtures;
	if (fixtures.platform === 'android') {
		const prompts = CHROME_FIRST_RUN_PROMPTS.map(({ prompt, dismiss }) => ({
			prompt: screen.getByText(prompt, { visible: true }),
			dismiss: screen.getByText(dismiss, { visible: true })
		}));
		for (;;) {
			const visible = await firstVisible([destination, ...prompts.map(({ prompt }) => prompt)]);
			const shownPrompt = prompts.find(({ prompt }) => prompt === visible);
			if (!shownPrompt) {
				break;
			}
			await tapIfVisible(shownPrompt.dismiss);
		}
	}
	await expect(destination).toBeVisible({ timeout: LONG_TIMEOUT });
};

const PASSWORD_MANAGER_PROMPTS = {
	android: { prompt: /Save password to Google Password Manager/, dismiss: 'Never' },
	ios: { prompt: /Save Password/, dismiss: 'Never for this Website' }
} as const;

export const dismissPasswordManagerPrompt = async (fixtures: Fixtures, destinations: readonly Locator[]) => {
	const { screen, platform } = fixtures;
	const { prompt, dismiss } = PASSWORD_MANAGER_PROMPTS[platform === 'android' ? 'android' : 'ios'];
	const promptText = screen.getByText(prompt, { visible: true });
	if ((await firstVisible([promptText, ...destinations])) === promptText) {
		await screen.getByText(dismiss, { visible: true }).tap();
	}
};

export const casField = ({ screen, platform }: Fixtures, field: 'username' | 'password') =>
	platform === 'android'
		? screen.getByTestId(field)
		: screen.getByRole('textbox', field === 'username' ? 'Username' : 'Password');

const DEEP_LINK_ATTEMPTS = 3;

export const loginWithDeepLinkIntoRunningApp = async (fixtures: Fixtures, credentials: Credentials) => {
	const roomsList = fixtures.screen.getByTestId('rooms-list-view');
	await fixtures.device.installApp(undefined, { reinstall: true });
	await fixtures.app.open();
	await expect(fixtures.screen.getByText('Add workspace')).toBeVisible({ timeout: LONG_TIMEOUT });
	const session = await login(credentials);
	const link = getDeepLink('auth', data.server, { userId: session.userId, token: session.authToken });
	for (let attempt = 1; attempt <= DEEP_LINK_ATTEMPTS && !(await roomsList.isVisible()); attempt += 1) {
		await openDeepLink(fixtures, link, roomsList);
		await roomsList.waitFor({ timeout: 20_000 }).catch(() => undefined);
	}
	await expect(roomsList).toBeVisible({ timeout: LONG_TIMEOUT });
};
