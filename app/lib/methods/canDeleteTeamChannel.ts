import { RoomType } from '~/definitions';
import { store as reduxStore } from '~/lib/store/auxStore';
import { compareServerVersion, hasPermission } from './helpers';

export const canDeleteTeamChannel = async (channel: { rid: string; t: string }, teamRoomId: string): Promise<boolean> => {
	const { permissions, server } = reduxStore.getState();
	const isPublic = channel.t === RoomType.CHANNEL;

	const [canDeleteRoom] = await hasPermission([permissions[isPublic ? 'delete-c' : 'delete-p']], channel.rid);
	if (!canDeleteRoom || compareServerVersion(server.version, 'lowerThan', '7.0.0')) {
		return canDeleteRoom;
	}

	const [canDeleteFromTeam] = await hasPermission(
		[permissions[isPublic ? 'delete-team-channel' : 'delete-team-group']],
		teamRoomId
	);
	return canDeleteFromTeam;
};
