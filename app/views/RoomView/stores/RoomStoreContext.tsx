import { createContext, useContext } from 'react';
import { useStore } from 'zustand';

import { type RoomState, type RoomStore } from '../definitions';

export const RoomStoreContext = createContext<RoomStore | null>(null);

export const useRoomStore = <T,>(selector: (state: RoomState) => T): T => {
	const store = useContext(RoomStoreContext);
	if (!store) {
		throw new Error('Room store hooks must be used within a RoomStoreContext.Provider');
	}
	return useStore(store, selector);
};

export const useRoomWithUpdate = (): RoomState['room'] => {
	const room = useRoomStore(s => s.room);
	// The room model mutates in place, so tracked-column changes keep the same `room` reference.
	// Subscribing to `roomUpdate` (a fresh snapshot per emit) is what re-renders the caller.
	useRoomStore(s => s.roomUpdate);
	return room;
};
