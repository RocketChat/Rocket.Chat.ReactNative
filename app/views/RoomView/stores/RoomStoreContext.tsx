import { createContext, useContext } from 'react';
import { useStore, type StoreApi } from 'zustand';

import { type RoomState, type RoomStore } from '../definitions';

export const RoomStoreContext = createContext<RoomStore | null>(null);

const useRoomStoreApi = (): RoomStore => {
	const store = useContext(RoomStoreContext);
	if (!store) {
		throw new Error('Room store hooks must be used within a RoomStoreContext.Provider');
	}
	return store;
};

export const useRoomStore = <T,>(selector: (state: RoomState) => T): T => useStore(useRoomStoreApi(), selector);

// The room model mutates in place, so tracked-column changes keep the same `room` reference.
// Subscribing to `roomUpdate` (a fresh snapshot per emit) is what re-renders the caller. Works on
// any store carrying `{ room, roomUpdate }` (RoomStore or ComposerStore); read both from the same
// instance so the returned room stays fresh per emit.
export const useRoomWithUpdateFromStore = <S extends { room: unknown; roomUpdate?: unknown }>(store: StoreApi<S>): S['room'] => {
	const room = useStore(store, s => s.room);
	useStore(store, s => s.roomUpdate);
	return room;
};

export const useRoomWithUpdate = (): RoomState['room'] => useRoomWithUpdateFromStore(useRoomStoreApi());
