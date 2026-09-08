import { createRoomSnapshot, getRoom } from '../../../../lib/roomObservation';
import { useRoomStore } from '../RoomStoreContext';

const room = { rid: 'rid-1', t: 'c' };

describe('RoomSnapshot opacity', () => {
	it('keeps the type-level assertions in this file compiling', () => {
		expect(typeof getRoom).toBe('function');
	});
});

export const selectorCannotReachTheSubscription = () =>
	// @ts-expect-error the Subscription inside a RoomSnapshot is not addressable from store state
	useRoomStore(s => s.roomSnapshot.room);

export const snapshotHasNoRoomProperty = () => {
	const snapshot = createRoomSnapshot(room);
	// @ts-expect-error a RoomSnapshot exposes its Subscription only through getRoom
	return snapshot.room;
};
