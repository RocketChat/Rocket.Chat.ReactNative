import { type NonDirectRoomType, RoomType } from '~/definitions/IRoom';

const apiTypeByRoomType = {
	[RoomType.CHANNEL]: 'channels',
	[RoomType.DIRECT]: 'im',
	[RoomType.GROUP]: 'groups',
	[RoomType.OMNICHANNEL]: 'channels'
} as const satisfies Record<RoomType, string>;

const pathSegmentByRoomType = {
	[RoomType.CHANNEL]: 'channel',
	[RoomType.GROUP]: 'group',
	[RoomType.DIRECT]: 'direct',
	[RoomType.OMNICHANNEL]: 'channels'
} as const satisfies Record<RoomType, string>;

const roomTypes = Object.values(RoomType);

export const roomTypeToApiType = <T extends RoomType>(t: T) => apiTypeByRoomType[t];

export const roomTypeToPathSegment = (t: RoomType) => pathSegmentByRoomType[t];

export const pathSegmentToRoomType = (segment?: string): RoomType | undefined =>
	roomTypes.find(t => pathSegmentByRoomType[t] === segment);

export const isNonDirectRoom = <T extends { t: RoomType }>(room: T): room is T & { t: NonDirectRoomType } =>
	room.t !== RoomType.DIRECT;

export const isGroupChat = (room?: { uids?: string[]; usernames?: string[] } | null): boolean =>
	(room?.uids?.length ?? 0) > 2 || (room?.usernames?.length ?? 0) > 2;

export const isTeamRoom = ({ teamId, joined }: { teamId?: string; joined?: boolean }): boolean => (!!teamId && joined) ?? false;
