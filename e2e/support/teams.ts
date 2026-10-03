import { expect } from 'e2e';

import { goBack, hideKeyboard, type Fixtures, LONG_TIMEOUT, tapWhenVisible } from './flows';
import { selectUser } from './room';

const fillCreateChannelName = async (fixtures: Fixtures, name: string) => {
	await fixtures.screen.getByTestId('create-channel-name').fill(name);
	await hideKeyboard(fixtures);
};

const submitCreateChannel = async ({ screen }: Fixtures) => {
	await screen.scrollUntilVisible(screen.getByTestId('create-channel-submit'));
	await screen.getByTestId('create-channel-submit').tap();
};

const openCreateFromRoomsList = async (fixtures: Fixtures, createButtonTestId: string, members: readonly string[] = []) => {
	const { screen } = fixtures;
	await expect(screen.getByTestId('rooms-list-view-create-channel')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId('rooms-list-view-create-channel').tap();
	await expect(screen.getByTestId(createButtonTestId)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId(createButtonTestId).tap();
	await expect(screen.getByTestId('select-users-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	for (const member of members) {
		await selectUser(fixtures, member);
	}
	await screen.getByTestId('selected-users-view-submit').tap();
	await expect(screen.getByTestId('create-channel-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const createTeam = async (fixtures: Fixtures, name: string) => {
	await openCreateFromRoomsList(fixtures, 'new-message-view-create-team');
	await fillCreateChannelName(fixtures, name);
	await submitCreateChannel(fixtures);
	await expect(fixtures.screen.getByTestId(`room-view-title-${name}`)).toBeVisible({ timeout: LONG_TIMEOUT });
};

interface ChannelOptions {
	publicChannel?: boolean;
	encrypted?: boolean;
	members?: readonly string[];
}

export const createAndOpenChannel = async (
	fixtures: Fixtures,
	name: string,
	{ publicChannel = false, encrypted = false, members = [] }: ChannelOptions = {}
) => {
	const { screen } = fixtures;
	await openCreateFromRoomsList(fixtures, 'new-message-view-create-channel', members);
	await fillCreateChannelName(fixtures, name);
	if (publicChannel) {
		await screen.getByTestId('create-channel-type').tap();
	}
	if (encrypted) {
		await tapWhenVisible(fixtures, 'create-channel-encrypted');
	}
	await submitCreateChannel(fixtures);
	await expect(screen.getByTestId(`room-view-title-${name}`)).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const createChannel = async (fixtures: Fixtures, name: string, options: ChannelOptions = {}) => {
	const { screen } = fixtures;
	await createAndOpenChannel(fixtures, name, options);
	await goBack(fixtures);
	await expect(screen.getByTestId(`rooms-list-view-item-${name}`)).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const openMemberActionSheet = async ({ screen }: Fixtures, username: string) => {
	await expect(screen.getByTestId(`room-members-view-item-${username}`)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId(`room-members-view-item-${username}`).tap();
	await expect(screen.getByTestId('action-sheet')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const closeActionSheet = async ({ screen }: Fixtures) => {
	await screen.getByTestId('action-sheet-handle').tap();
	await expect(screen.getByTestId('action-sheet-handle')).toBeHidden({ timeout: LONG_TIMEOUT });
};
