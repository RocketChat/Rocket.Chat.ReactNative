import { createContext, useContext } from 'react';
import { useStore } from 'zustand';

import { type IRoomViewState, type RoomState, type RoomStore } from '../definitions';

export const RoomStoreContext = createContext<RoomStore | null>(null);

const useRoomStoreApi = (): RoomStore => {
	const store = useContext(RoomStoreContext);
	if (!store) {
		throw new Error('Room store hooks must be used within a RoomStoreContext.Provider');
	}
	return store;
};

export const useRoomStore = <T,>(selector: (state: RoomState) => T): T => useStore(useRoomStoreApi(), selector);

export const useRoomReadFromStore = (store: RoomStore): RoomState['room'] => useStore(store, s => s.room);

export const useRoomFromStore = (store: RoomStore): IRoomViewState['room'] => {
	return useRoomReadFromStore(store).room;
};

export const useRoom = (): IRoomViewState['room'] => useRoomFromStore(useRoomStoreApi());
