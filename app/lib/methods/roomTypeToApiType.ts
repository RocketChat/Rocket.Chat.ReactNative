import { RoomType } from '~/definitions/IRoom';

const apiTypeByRoomType = {
	[RoomType.CHANNEL]: 'channels',
	[RoomType.DIRECT]: 'im',
	[RoomType.GROUP]: 'groups',
	[RoomType.OMNICHANNEL]: 'channels'
} as const satisfies Record<RoomType, string>;

export const roomTypeToApiType = <T extends RoomType>(t: T) => apiTypeByRoomType[t];
