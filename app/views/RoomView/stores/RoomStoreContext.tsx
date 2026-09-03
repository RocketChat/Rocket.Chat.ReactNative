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

const useRerenderOnRoomMutatedInPlace = <S extends { roomUpdate?: unknown }>(store: StoreApi<S>): void => {
	useStore(store, s => s.roomUpdate);
};

export const useRoomWithUpdateFromStore = <S extends { room: unknown; roomUpdate?: unknown }>(store: StoreApi<S>): S['room'] => {
	useRerenderOnRoomMutatedInPlace(store);
	return useStore(store, s => s.room);
};

export const useRoomWithUpdate = (): RoomState['room'] => useRoomWithUpdateFromStore(useRoomStoreApi());
