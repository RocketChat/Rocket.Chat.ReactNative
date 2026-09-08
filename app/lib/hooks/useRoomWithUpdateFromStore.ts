import { useStore } from 'zustand';
import { type StoreApi } from 'zustand';

import { type TRoomOrPreview, type TRoomObservedFields } from '../../definitions/TRoom';

export interface IRoomWithUpdateState {
	room: TRoomOrPreview;
	roomUpdate?: TRoomObservedFields;
}

export const useRoomWithUpdateFromStore = <S extends IRoomWithUpdateState>(store: StoreApi<S>): S['room'] => {
	useStore(store, s => s.roomUpdate);
	return useStore(store, s => s.room);
};
