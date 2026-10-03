import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { type Fixtures, loginWithDeepLink, LONG_TIMEOUT, tapWhenVisible } from '~e2e/support/flows';
import { expectLabel } from '~e2e/support/keyboard';

const TOAST_CHECKED = 'Toasts. Dismissed automatically. Checked';
const DIALOG_UNCHECKED = 'Dialogs. Require manual dismissal. Unchecked';

const SHOW_ALERTS_AS = /^Show alerts as/;

const alertDisplayRow = ({ screen, platform }: Fixtures) =>
	platform === 'ios' ? screen.getByLabel(SHOW_ALERTS_AS).first() : screen.getByRole('button', { name: SHOW_ALERTS_AS });

const openAlertDisplayPicker = async (fixtures: Fixtures) => {
	await tapWhenVisible(fixtures, 'sidebar-accessibility');
	await expect(fixtures.screen.getByTestId('sidebar-view')).toBeHidden({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, alertDisplayRow(fixtures));
	await expectLabel(fixtures, TOAST_CHECKED);
};

const saveStatus = async (fixtures: Fixtures, status: 'online' | 'offline') => {
	const { screen } = fixtures;
	await tapWhenVisible(fixtures, 'accessibility-view-drawer');
	await screen.getByTestId(/^sidebar-custom-status-/).tap();
	await tapWhenVisible(fixtures, `status-view-${status}`);
	await screen.getByTestId('status-view-submit').tap();
	await expect(screen.getByText('Status saved successfully!')).toBeVisible({ timeout: LONG_TIMEOUT });
};

afterEach(deleteCreatedUsers);

test('shows alerts as toasts or dialogs', { tags: ['test-13'] }, async fixtures => {
	const { screen } = fixtures;
	const user = await createUser();
	await loginWithDeepLink(fixtures, user);

	await tapWhenVisible(fixtures, 'rooms-list-view-sidebar');
	await openAlertDisplayPicker(fixtures);
	await expectLabel(fixtures, DIALOG_UNCHECKED);
	await screen.getByTestId('action-sheet-handle').tap();
	await expect(screen.getByTestId('action-sheet')).toBeHidden({ timeout: LONG_TIMEOUT });
	await saveStatus(fixtures, 'offline');

	await openAlertDisplayPicker(fixtures);
	await screen.getByLabel(DIALOG_UNCHECKED).tap();
	await saveStatus(fixtures, 'online');
	const okButton = screen.getByRole('button', { name: /^OK$/i });
	await expect(okButton).toBeVisible({ timeout: LONG_TIMEOUT });
	await okButton.tap();
});
