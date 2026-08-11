import { createContext, useContext } from 'react';

import { type IRoomScreenContextValue } from '../definitions';

// The RoomView screen's own state, as opposed to the room's. Opening a thread mounts a second
// RoomView on the parent's rid, so both screens share one rid-keyed RoomStore — anything that must
// differ between them cannot live there. `loading` is one screen's init run, and `lastSeen` (the
// unread divider anchor) is one screen's divider, so a send from the thread screen clears its own
// anchor and leaves the room screen's divider where it was.
//
// This context is per RoomView instance, not per rid: each screen provides its own value to its own
// subtree.
export const RoomScreenContext = createContext<IRoomScreenContextValue | null>(null);

export const useRoomScreen = (): IRoomScreenContextValue => {
	const value = useContext(RoomScreenContext);
	if (!value) {
		throw new Error('Room screen hooks must be used within a RoomScreenContext.Provider');
	}
	return value;
};
