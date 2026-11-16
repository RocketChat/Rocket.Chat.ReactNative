import { RoomType } from '~/definitions/IRoom';
import { pathSegmentToRoomType } from '../roomTypePath';

describe('roomTypePath', () => {
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
