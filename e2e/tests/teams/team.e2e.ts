import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createRandomRoom, createRandomTeam, createUser, deleteCreatedUsers } from '~e2e/support/api';
import {
	backToRoomsList,
	confirmAlert,
	expectVisible,
	goBackUntil,
	hideKeyboard,
	loginWithDeepLink,
	navigateToRoom,
	type Fixtures,
	LONG_TIMEOUT,
	fillWhenUncovered,
	roomTitle,
	headerSearchInput
} from '~e2e/support/flows';
import {
	expectRoomMenuOptions,
	expectRoomTitle,
	selectHeaderMenuOption,
	tapHeaderItem,
	threadsButton,
	submitSelectedUsers
} from '~e2e/support/header';
import { random } from '~e2e/support/random';
import { selectUser } from '~e2e/support/room';
import { closeActionSheet, openMemberActionSheet } from '~e2e/support/teams';

afterEach(deleteCreatedUsers);

const expectRoomHeaderButtons = async (fixtures: Fixtures) => {
	await expect(threadsButton(fixtures)).toBeVisible({ timeout: LONG_TIMEOUT });
	await expectRoomMenuOptions(fixtures, [{ testId: 'room-view-header-call', iosLabel: /^Call / }]);
};

const openTeamChannels = async (fixtures: Fixtures) => {
	const { screen } = fixtures;
	await screen.getByTestId('room-header').first().tap();
	await screen.getByTestId('room-actions-teams').tap();
	await expectVisible(fixtures, 'team-channels-view');
};

const createTeamChannel = async (fixtures: Fixtures, channel: string) => {
	const { screen } = fixtures;
	await tapHeaderItem(fixtures, 'team-channels-view-create', 'Add channel to team');
	await expectVisible(fixtures, 'add-channel-team-view');
	await expectVisible(fixtures, 'add-channel-team-view-add-existing');
	await screen.getByTestId('add-channel-team-view-create-channel').tap();
	await selectUser(fixtures, 'rocket.cat');
	if (fixtures.platform === 'android') {
		await hideKeyboard(fixtures);
	}
	await submitSelectedUsers(fixtures);
	await expectVisible(fixtures, 'create-channel-view');
	await fillWhenUncovered(screen.getByTestId('create-channel-name'), channel);
	await hideKeyboard(fixtures);
	await screen.scrollUntilVisible(screen.getByTestId('create-channel-submit'));
	await screen.getByTestId('create-channel-submit').tap();
	await expectVisible(fixtures, 'room-view');
};

const addExistingChannel = async (fixtures: Fixtures, team: string, channel: string) => {
	const { screen } = fixtures;
	await tapHeaderItem(fixtures, 'team-channels-view-create', 'Add channel to team');
	await expectVisible(fixtures, 'add-channel-team-view');
	await screen.getByTestId('add-channel-team-view-add-existing').tap();
	await expectVisible(fixtures, 'add-existing-channel-view');
	await screen.getByTestId(`add-existing-channel-view-item-${channel}`).tap();
	await tapHeaderItem(fixtures, 'add-existing-channel-view-submit', 'Next');
	await expectRoomTitle(fixtures, team);
};

const toggleAutoJoin = async (fixtures: Fixtures, channel: string) => {
	const { screen } = fixtures;
	const channelRow = screen.getByTestId(`rooms-list-view-item-${channel}`);
	await channelRow.longPress();
	await screen.scrollUntilVisible(screen.getByTestId('action-sheet-delete'));
	for (const testId of ['action-sheet-auto-join', 'auto-join-unchecked', 'action-sheet-remove-from-team']) {
		await expectVisible(fixtures, testId);
	}
	await screen.getByTestId('auto-join-unchecked').tap();
	await expectVisible(fixtures, 'auto-join-tag');
	await channelRow.longPress();
	await screen.getByTestId('auto-join-checked').tap();
	await expect(screen.getByTestId('auto-join-tag')).toBeHidden({ timeout: LONG_TIMEOUT });
	await expect(channelRow).toBeVisible({ timeout: LONG_TIMEOUT });
};

const addMembers = async (fixtures: Fixtures, usernames: string[]) => {
	const { screen } = fixtures;
	await screen.getByTestId('room-actions-members').tap();
	await expectVisible(fixtures, 'room-members-view');
	await screen.getByTestId('room-actions-add-user').tap();
	for (const username of usernames) {
		await selectUser(fixtures, username);
	}
	if (fixtures.platform === 'android') {
		await hideKeyboard(fixtures);
	}
	await submitSelectedUsers(fixtures);
	await selectHeaderMenuOption(
		fixtures,
		{ testId: 'room-members-view-filter', iosLabel: 'Filter' },
		{ testId: 'room-members-view-toggle-status-all', iosLabel: 'All' }
	);
	await expectVisible(fixtures, `room-members-view-item-${usernames[usernames.length - 1]}`);
};

const checkedIndicator = ({ screen, platform }: Fixtures, channel: string) =>
	platform === 'ios' ? screen.getByRole('button', { name: `${channel} Checked` }) : screen.getByTestId(`${channel}-checked`);

const removeMemberKeepingChannel = async (fixtures: Fixtures, username: string, channel: string) => {
	const { screen } = fixtures;
	await openMemberActionSheet(fixtures, username);
	await screen.getByTestId('action-sheet-remove-from-team').tap();
	await screen.getByTestId(`select-list-view-item-${channel}`).tap();
	await expect(checkedIndicator(fixtures, channel)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId(`select-list-view-item-${channel}`).tap();
	await expect(checkedIndicator(fixtures, channel)).toBeHidden({ timeout: LONG_TIMEOUT });
	await tapHeaderItem(fixtures, 'select-list-view-submit', 'Next');
	await expect(screen.getByTestId(`room-members-view-item-${username}`)).toBeHidden({ timeout: LONG_TIMEOUT });
};

const setMemberAsOwner = async (fixtures: Fixtures, username: string) => {
	await openMemberActionSheet(fixtures, username);
	await fixtures.screen.getByTestId('action-sheet-set-owner').tap();
	await openMemberActionSheet(fixtures, username);
	await expectVisible(fixtures, 'action-sheet-set-owner-checked');
	await closeActionSheet(fixtures);
};

const leaveTeam = async (fixtures: Fixtures, team: string, channels: { existing: string; created: string }) => {
	const { screen } = fixtures;
	await goBackUntil(fixtures, 'room-actions-view');
	await screen.scrollUntilVisible(screen.getByTestId('room-actions-leave-channel'));
	await screen.getByTestId('room-actions-leave-channel').tap();
	await expectVisible(fixtures, 'select-list-view');
	await expectVisible(fixtures, `select-list-view-item-${channels.existing}`);
	await screen.getByTestId(`select-list-view-item-${channels.created}`).tap();
	await confirmAlert(fixtures, /You are the last owner of this channel/, /^OK$/i);
	await tapHeaderItem(fixtures, 'select-list-view-submit', 'Next');
	await expectVisible(fixtures, 'rooms-list-view');
	await expect(screen.getByTestId(`rooms-list-view-item-${team}`)).toBeHidden({ timeout: LONG_TIMEOUT });
};

test('manages a team', { tags: ['test-3'] }, async fixtures => {
	const { screen } = fixtures;
	const owner = await createUser();
	const member = await createUser();
	const team = await createRandomTeam(owner);
	const room = await createRandomRoom(owner);
	const privateChannel = `private${random()}-channel-team`;

	await loginWithDeepLink(fixtures, owner);
	await navigateToRoom(fixtures, team);
	await expectRoomHeaderButtons(fixtures);

	await openTeamChannels(fixtures);
	await expect(headerSearchInput(fixtures, 'team-channels-view-search')).toBeVisible({ timeout: LONG_TIMEOUT });
	await createTeamChannel(fixtures, privateChannel);
	await openTeamChannels(fixtures);
	await screen.getByTestId(`rooms-list-view-item-${privateChannel}`).tap();
	await expectRoomTitle(fixtures, privateChannel);
	await expectRoomHeaderButtons(fixtures);
	await backToRoomsList(fixtures);

	await navigateToRoom(fixtures, team);
	await openTeamChannels(fixtures);
	await addExistingChannel(fixtures, team, room.name);
	await openTeamChannels(fixtures);
	await expectVisible(fixtures, `rooms-list-view-item-${room.name}`);

	await toggleAutoJoin(fixtures, privateChannel);
	await goBackUntil(fixtures, 'room-actions-view');
	await goBackUntil(fixtures, roomTitle(fixtures, team));
	await screen.getByTestId('room-header').first().tap();
	await expectVisible(fixtures, 'room-actions-view');

	await addMembers(fixtures, ['rocket.cat', member.username]);
	await removeMemberKeepingChannel(fixtures, 'rocket.cat', privateChannel);
	await setMemberAsOwner(fixtures, member.username);
	await leaveTeam(fixtures, team, { existing: room.name, created: privateChannel });
});
