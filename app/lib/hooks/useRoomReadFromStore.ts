import { useStore, type StoreApi } from 'zustand';

import { type TRoomOrPreview } from '../../definitions/TRoom';

export type RoomRead = { room: TRoomOrPreview };

export interface IRoomReadState {
	room: RoomRead;
}

export const useRoomReadFromStore = <S extends IRoomReadState>(store: StoreApi<S>): S['room'] => useStore(store, s => s.room);
