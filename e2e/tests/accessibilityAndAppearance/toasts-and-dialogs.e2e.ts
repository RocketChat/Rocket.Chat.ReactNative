import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	expectVisible,
	type Fixtures,
	loginWithDeepLink,
	LONG_TIMEOUT,
	tapUntilHidden,
	tapWhenVisible
} from '~e2e/support/flows';
import { tapHeaderItem } from '~e2e/support/header';
import { expectLabel } from '~e2e/support/keyboard';
import { openSidebar } from '~e2e/support/settings';

const TOAST_CHECKED = 'Toasts. Dismissed automatically. Checked';
const DIALOG_UNCHECKED = 'Dialogs. Require manual dismissal. Unchecked';

const SHOW_ALERTS_AS = /^Show alerts as/;

const alertDisplayRow = ({ screen, platform }: Fixtures) =>
	platform === 'ios'
		? screen.getByRole('button', { name: SHOW_ALERTS_AS }).last()
		: screen.getByRole('button', { name: SHOW_ALERTS_AS });

const alertDisplayValue = ({ screen }: Fixtures, value: string) =>
	screen.getByText(new RegExp(`^(Show alerts as, )?${value}$`)).first();

const openAccessibility = async (fixtures: Fixtures) => {
	await expectVisible(fixtures, 'sidebar-accessibility');
	await tapUntilHidden(fixtures, 'sidebar-accessibility', 'sidebar-view');
};

const openAlertDisplayPicker = async (fixtures: Fixtures) => {
	await tapWhenVisible(fixtures, alertDisplayRow(fixtures));
	await expectLabel(fixtures, TOAST_CHECKED);
};

const expectToastsSelected = async (fixtures: Fixtures) => {
	const { screen, platform } = fixtures;
	if (platform === 'ios') {
		await expect(alertDisplayValue(fixtures, 'Toasts')).toBeVisible({ timeout: LONG_TIMEOUT });
		return;
	}
	await openAlertDisplayPicker(fixtures);
	await expectLabel(fixtures, DIALOG_UNCHECKED);
	await screen.getByTestId('action-sheet-handle').tap();
	await expect(screen.getByTestId('action-sheet')).toBeHidden({ timeout: LONG_TIMEOUT });
};

const selectDialogs = async (fixtures: Fixtures) => {
	const { screen, platform } = fixtures;
	if (platform === 'ios') {
		await tapWhenVisible(fixtures, alertDisplayRow(fixtures));
		await tapWhenVisible(fixtures, screen.getByText('Dialogs').last());
		await expect(alertDisplayValue(fixtures, 'Dialogs')).toBeVisible({ timeout: LONG_TIMEOUT });
		return;
	}
	await openAlertDisplayPicker(fixtures);
	await screen.getByLabel(DIALOG_UNCHECKED).tap();
};

const saveStatus = async (fixtures: Fixtures, status: 'online' | 'offline') => {
	const { screen } = fixtures;
	await tapHeaderItem(fixtures, 'accessibility-view-drawer', 'Menu');
	await screen.getByTestId(/^sidebar-custom-status-/).tap();
	await tapWhenVisible(fixtures, `status-view-${status}`);
	await screen.getByTestId('status-view-submit').tap();
	await expect(screen.getByText('Status saved successfully!')).toBeVisible({ timeout: LONG_TIMEOUT });
};

afterEach(deleteCreatedUsers);

test('shows alerts as toasts or dialogs', { tags: ['test-3'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	await loginWithDeepLink(fixtures, user);

	await openSidebar(fixtures);
	await openAccessibility(fixtures);
	await expectToastsSelected(fixtures);
	await saveStatus(fixtures, 'offline');

	await openAccessibility(fixtures);
	await selectDialogs(fixtures);
	await saveStatus(fixtures, 'online');
	const okButton = screen.getByRole('button', { name: /^OK$/i });
	await expect(okButton).toBeVisible({ timeout: LONG_TIMEOUT });
	await okButton.tap();
});
