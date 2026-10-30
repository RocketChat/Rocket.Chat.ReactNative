import { RoomType } from '~/definitions/IRoom';
import { pathSegmentToRoomType, roomTypeToPathSegment } from '../roomTypePath';

describe('roomTypePath', () => {
	it.each(Object.values(RoomType))('reads back room type %s from its path segment', roomType => {
		expect(pathSegmentToRoomType(roomTypeToPathSegment(roomType))).toBe(roomType);
	});

	it.each([
		['channel', RoomType.CHANNEL],
		['group', RoomType.GROUP],
		['direct', RoomType.DIRECT],
		['channels', RoomType.OMNICHANNEL]
	])('reads the permalink segment %s as room type %s', (segment, roomType) => {
		expect(pathSegmentToRoomType(segment)).toBe(roomType);
	});

	it.each([undefined, '', 'invite', 'c'])('reads %p as no room type', segment => {
		expect(pathSegmentToRoomType(segment)).toBeUndefined();
	});
});
