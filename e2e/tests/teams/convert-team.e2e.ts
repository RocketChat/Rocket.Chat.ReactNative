import { afterEach, test } from '@e2e-dev/mobile';
import { expect } from 'e2e';

import { createUser, deleteCreatedUsers } from '~e2e/support/api';
import { goBack, goBackUntil, loginWithDeepLink, navigateToRoomActions, type Fixtures, LONG_TIMEOUT } from '~e2e/support/flows';
import { random } from '~e2e/support/random';
import { createChannel } from '~e2e/support/teams';

afterEach(deleteCreatedUsers);

const expectRoomsList = ({ screen }: Fixtures) =>
	expect(screen.getByTestId('rooms-list-view')).toBeVisible({ timeout: LONG_TIMEOUT });

const convertChannelToTeam = async (fixtures: Fixtures, channel: string) => {
	const { screen } = fixtures;
	await navigateToRoomActions(fixtures, channel);
	await screen.scrollUntilVisible(screen.getByTestId('room-actions-convert-to-team'));
	await screen.getByTestId('room-actions-convert-to-team').tap();
	await expect(screen.getByText(/You are converting this channel to a team. All members will be kept./)).toBeVisible({
		timeout: LONG_TIMEOUT
	});
	await screen.getByRole('button', { name: /^Convert$/i }).tap();
	await expect(screen.getByTestId(`room-view-title-${channel}`)).toBeVisible({ timeout: LONG_TIMEOUT });
	await goBack(fixtures);
	await expectRoomsList(fixtures);
};

const moveChannelToTeam = async (fixtures: Fixtures, channel: string, team: string) => {
	const { screen } = fixtures;
	await navigateToRoomActions(fixtures, channel);
	await screen.scrollUntilVisible(screen.getByTestId('room-actions-move-to-team'));
	await screen.getByTestId('room-actions-move-to-team').tap();
	await screen.getByTestId('select-list-view-submit').tap();
	await screen.getByTestId(`select-list-view-item-${team}`).tap();
	await screen.getByTestId('select-list-view-submit').tap();
	await expect(
		screen.getByText(
			/After reading the previous instructions about this behavior, do you still want to move this channel to the selected team?/
		)
	).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByRole('button', { name: /^Yes, move it!$/i }).tap();
	await screen.getByTestId('room-header').first().tap();
	await expect(screen.getByTestId('room-actions-teams')).toBeVisible({ timeout: LONG_TIMEOUT });
	await goBackUntil(fixtures, 'room-view');
	await goBackUntil(fixtures, 'rooms-list-view');
	await expectRoomsList(fixtures);
};

const convertTeamToChannel = async (fixtures: Fixtures, team: string, channelToDelete: string) => {
	const { screen } = fixtures;
	await navigateToRoomActions(fixtures, team);
	await screen.scrollUntilVisible(screen.getByText('Convert to channel'));
	await screen.getByText('Convert to channel').tap();
	await expect(screen.getByText(/Converting team to channel/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByTestId(`select-list-view-item-${channelToDelete}`).tap();
	await screen.getByTestId('select-list-view-submit').tap();
	await expect(screen.getByText(/You are converting this team to a channel/)).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByRole('button', { name: /^Convert$/i }).tap();
	await expect(screen.getByTestId(`room-view-title-${team}`)).toBeVisible({ timeout: LONG_TIMEOUT });
	await goBack(fixtures);
	await expectRoomsList(fixtures);
	await expect(screen.getByTestId(`rooms-list-view-item-${channelToDelete}`)).toBeHidden({ timeout: LONG_TIMEOUT });
};

test('converts channels and teams', { tags: ['test-6'] }, async fixtures => {
	const user = await createUser();
	const toBeConverted = `to-be-converted-${random()}`;
	const toBeMoved = `to-be-moved-${random()}`;
	const publicChannelToBeConverted = `channel-public-to-be-converted-${random()}`;

	await loginWithDeepLink(fixtures, user);

	await createChannel(fixtures, publicChannelToBeConverted, { publicChannel: true });
	await convertChannelToTeam(fixtures, publicChannelToBeConverted);

	await createChannel(fixtures, toBeConverted);
	await convertChannelToTeam(fixtures, toBeConverted);

	await createChannel(fixtures, toBeMoved);
	await moveChannelToTeam(fixtures, toBeMoved, toBeConverted);

	await convertTeamToChannel(fixtures, toBeConverted, toBeMoved);
});
