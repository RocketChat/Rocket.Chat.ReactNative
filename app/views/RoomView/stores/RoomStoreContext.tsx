import { createContext, useContext } from 'react';
import { useStore } from 'zustand';

import { type RoomState, type RoomStore } from '../definitions';
import { useRoomWithUpdateFromStore } from '../../../lib/hooks/useRoomWithUpdateFromStore';
import { type TRoomOrPreview } from '../../../definitions/TRoom';

export const RoomStoreContext = createContext<RoomStore | null>(null);

const useRoomStoreApi = (): RoomStore => {
	const store = useContext(RoomStoreContext);
	if (!store) {
		throw new Error('Room store hooks must be used within a RoomStoreContext.Provider');
	}
	return store;
};

export const useRoomStore = <T,>(selector: (state: RoomState) => T): T => useStore(useRoomStoreApi(), selector);

export const useRoomWithUpdate = (): TRoomOrPreview => useRoomWithUpdateFromStore(useRoomStoreApi());
