import { RoomType } from '~/definitions/IRoom';
import { pathSegmentToRoomType, roomTypeToPathSegment } from '../roomTypePath';

describe('roomTypePath', () => {
	it.each([
		['channel', RoomType.CHANNEL],
		['group', RoomType.GROUP],
		['direct', RoomType.DIRECT],
		['channels', RoomType.OMNICHANNEL]
	])('maps the permalink segment %s to room type %s and back', (segment, roomType) => {
		expect(pathSegmentToRoomType(segment)).toBe(roomType);
		expect(roomTypeToPathSegment(roomType)).toBe(segment);
	});

	it.each([undefined, '', 'invite', 'c'])('reads %p as no room type', segment => {
		expect(pathSegmentToRoomType(segment)).toBeUndefined();
	});
});
