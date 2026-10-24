import type { Fixtures } from './flows';
import { expectRoomTitle } from './header';

export const openRoom = async (fixtures: Fixtures, room: string) => {
	await fixtures.appduct.call('open_room', { name: room });
	await expectRoomTitle(fixtures, room);
};
