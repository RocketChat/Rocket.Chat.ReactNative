import { useStore } from 'zustand';
import { type StoreApi } from 'zustand';

import { type TRoomOrPreview, type TRoomUpdatePatch } from '../../definitions/TRoom';

export interface IRoomWithUpdateState {
	room: TRoomOrPreview;
	roomUpdate?: TRoomUpdatePatch;
}

export const useRoomWithUpdateFromStore = <S extends IRoomWithUpdateState>(store: StoreApi<S>): S['room'] => {
	useStore(store, s => s.roomUpdate);
	return useStore(store, s => s.room);
};
