import { expect } from 'e2e';

import {
	goBack,
	hideKeyboard,
	type Fixtures,
	LONG_TIMEOUT,
	tapWhenVisible,
	fillWhenUncovered,
	headerItem,
	tapUntilVisible
} from './flows';
import { expectRoomTitle, submitSelectedUsers } from './header';
import { selectUser } from './room';

const fillCreateChannelName = async (fixtures: Fixtures, name: string) => {
	await fillWhenUncovered(fixtures.screen.getByTestId('create-channel-name'), name);
	await hideKeyboard(fixtures);
};

const submitCreateChannel = async ({ screen }: Fixtures) => {
	await screen.scrollUntilVisible(screen.getByTestId('create-channel-submit'));
	await screen.getByTestId('create-channel-submit').tap();
};

const openCreateFromRoomsList = async (fixtures: Fixtures, createButtonTestId: string, members: readonly string[] = []) => {
	const { screen } = fixtures;
	await tapWhenVisible(
		fixtures,
		headerItem(fixtures, 'rooms-list-view-create-channel', 'Create new channel, team, direct message or discussion')
	);
	await expect(screen.getByTestId(createButtonTestId)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId(createButtonTestId).tap();
	await expect(screen.getByTestId('select-users-view')).toBeVisible({ timeout: LONG_TIMEOUT });
	for (const member of members) {
		await selectUser(fixtures, member);
	}
	await submitSelectedUsers(fixtures);
	await expect(screen.getByTestId('create-channel-view')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const createTeam = async (fixtures: Fixtures, name: string) => {
	await openCreateFromRoomsList(fixtures, 'new-message-view-create-team');
	await fillCreateChannelName(fixtures, name);
	await submitCreateChannel(fixtures);
	await expectRoomTitle(fixtures, name);
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
	await expectRoomTitle(fixtures, name);
};

export const createChannel = async (fixtures: Fixtures, name: string, options: ChannelOptions = {}) => {
	const { screen } = fixtures;
	await createAndOpenChannel(fixtures, name, options);
	await goBack(fixtures);
	await expect(screen.getByTestId(`rooms-list-view-item-${name}`)).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const openMemberActionSheet = async (fixtures: Fixtures, username: string) => {
	const member = fixtures.screen.getByTestId(`room-members-view-item-${username}`);
	await expect(member).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapUntilVisible(fixtures, member, 'action-sheet');
};

export const closeActionSheet = async ({ screen }: Fixtures) => {
	await screen.getByTestId('action-sheet-handle').tap();
	await expect(screen.getByTestId('action-sheet-handle')).toBeHidden({ timeout: LONG_TIMEOUT });
};
