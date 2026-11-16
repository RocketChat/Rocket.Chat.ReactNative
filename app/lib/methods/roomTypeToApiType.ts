import { type RoomType } from '~/definitions/IRoom';

const apiTypeByRoomType = {
	c: 'channels',
	d: 'im',
	p: 'groups',
	l: 'channels'
} as const satisfies Record<RoomType, string>;

export const roomTypeToApiType = <T extends RoomType>(t: T) => apiTypeByRoomType[t];
