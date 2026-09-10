import { createContext, useContext } from 'react';
import { useStore } from 'zustand';

import { type RoomState, type RoomStore } from '../definitions';
import { type TSubscriptionModel } from '../../../definitions/ISubscription';
import { isSubscriptionModel } from '../../../definitions/TRoom';

export const RoomStoreContext = createContext<RoomStore | null>(null);

export const useRoomStoreApi = (): RoomStore => {
	const store = useContext(RoomStoreContext);
	if (!store) {
		throw new Error('Room store hooks must be used within a RoomStoreContext.Provider');
	}
	return store;
};

export const useRoomStore = <T,>(selector: (state: RoomState) => T): T => useStore(useRoomStoreApi(), selector);

export const fromSubscription =
	<T,>(select: (room: TSubscriptionModel) => T, previewValue: T) =>
	(state: RoomState): T =>
		isSubscriptionModel(state.room) ? select(state.room) : previewValue;
