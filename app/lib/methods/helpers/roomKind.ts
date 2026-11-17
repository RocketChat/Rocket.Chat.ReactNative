import { type NonDirectRoomType, RoomType } from '~/definitions/IRoom';

export const isNonDirectRoom = <T extends { t: RoomType }>(room: T): room is T & { t: NonDirectRoomType } =>
	room.t !== RoomType.DIRECT;

export const isGroupChat = (room?: { uids?: string[]; usernames?: string[] } | null): boolean =>
	(room?.uids?.length ?? 0) > 2 || (room?.usernames?.length ?? 0) > 2;

export const isTeamRoom = ({ teamId, joined }: { teamId?: string; joined?: boolean }): boolean => (!!teamId && joined) ?? false;
