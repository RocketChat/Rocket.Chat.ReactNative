import { RoomType } from '~/definitions/IRoom';
import { type ISubscription } from '~/definitions/ISubscription';
import { store as reduxStore } from '~/lib/store/auxStore';
import { compareServerVersion } from './helpers/compareServerVersion';
import { hasPermission } from './helpers/hasPermission';

export const canDeleteTeamChannel = async (channel: Pick<ISubscription, 'rid' | 't'>, teamRoomId: string): Promise<boolean> => {
	const { permissions, server } = reduxStore.getState();
	const isPublic = channel.t === RoomType.CHANNEL;

	const [canDeleteRoom] = await hasPermission([permissions[isPublic ? 'delete-c' : 'delete-p']], channel.rid);
	if (!canDeleteRoom || !compareServerVersion(server.version, 'greaterThanOrEqualTo', '7.0.0')) {
		return canDeleteRoom;
	}

	const [canDeleteFromTeam] = await hasPermission(
		[permissions[isPublic ? 'delete-team-channel' : 'delete-team-group']],
		teamRoomId
	);
	return canDeleteFromTeam;
};
