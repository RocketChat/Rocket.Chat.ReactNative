import { expect } from 'e2e';

import { serverHost } from './api';
import { type Fixtures, LONG_TIMEOUT, tapWhenVisible } from './flows';

export const checkServer = async (fixtures: Fixtures, server: string) => {
	const { screen } = fixtures;
	await tapWhenVisible(fixtures, 'rooms-list-view-sidebar');
	await expect(screen.getByTestId('sidebar-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expect(screen.getByText(`Connected to ${server}`, { exact: false })).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapWhenVisible(fixtures, 'sidebar-close-drawer');
	await expect(screen.getByTestId('sidebar-close-drawer')).toBeHidden({ timeout: LONG_TIMEOUT });
};

export const openServersList = async (fixtures: Fixtures) => {
	await tapWhenVisible(fixtures, 'rooms-list-header-servers-list-button');
	await expect(fixtures.screen.getByTestId('rooms-list-header-servers-list')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const expectConnectedTo = ({ screen }: Fixtures, server: string) =>
	expect(screen.getByTestId('rooms-list-header-server-subtitle')).toHaveText(serverHost(server), { timeout: LONG_TIMEOUT });

export const selectServer = async (fixtures: Fixtures, server: string) => {
	await openServersList(fixtures);
	await tapWhenVisible(fixtures, `server-item-${server}`);
	await expectConnectedTo(fixtures, server);
};

export const addServerFromServersList = async (fixtures: Fixtures, server: string) => {
	const { screen } = fixtures;
	await tapWhenVisible(fixtures, 'rooms-list-header-server-add');
	await expect(screen.getByTestId('new-server-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('new-server-view-input').fill(server);
	await screen.getByTestId('new-server-view-input').press('Enter');
	await expect(screen.getByTestId('workspace-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const deleteServer = async (fixtures: Fixtures, server: string) => {
	const { screen } = fixtures;
	await openServersList(fixtures);
	const serverItem = screen.getByTestId(`server-item-${server}`);
	await expect(serverItem).toBeVisible({ timeout: LONG_TIMEOUT });
	await serverItem.swipe({ direction: 'right', momentum: 'slow' });
	await screen.getByTestId(`server-item-${server}-delete`).tap();
	const confirmDelete = screen.getByRole('button', { name: /^Delete$/i }).last();
	await expect(confirmDelete).toBeVisible({ timeout: LONG_TIMEOUT });
	await confirmDelete.tap();
	await expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const relaunchApp = async (fixtures: Fixtures, server: string) => {
	await fixtures.app.restart();
	await expect(fixtures.screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	await expectConnectedTo(fixtures, server);
};
