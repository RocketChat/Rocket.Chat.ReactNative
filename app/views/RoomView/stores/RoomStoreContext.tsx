import { createContext, useContext } from 'react';
import { useStore } from 'zustand';

import { type RoomState, type RoomStore } from './RoomStore';

export const RoomStoreContext = createContext<RoomStore | null>(null);

export const useRoomStore = <T,>(selector: (state: RoomState) => T): T => {
	const store = useContext(RoomStoreContext);
	if (!store) {
		throw new Error('Room store hooks must be used within a RoomStoreContext.Provider');
	}
	return useStore(store, selector);
};
