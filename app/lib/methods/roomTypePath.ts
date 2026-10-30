import { RoomType } from '~/definitions/IRoom';

const pathSegmentByRoomType = {
	[RoomType.CHANNEL]: 'channel',
	[RoomType.GROUP]: 'group',
	[RoomType.DIRECT]: 'direct',
	[RoomType.OMNICHANNEL]: 'channels'
} as const satisfies Record<RoomType, string>;

const roomTypes = Object.values(RoomType);

export const roomTypeToPathSegment = (t: RoomType) => pathSegmentByRoomType[t];

export const pathSegmentToRoomType = (segment?: string): RoomType | undefined =>
	roomTypes.find(t => pathSegmentByRoomType[t] === segment);
