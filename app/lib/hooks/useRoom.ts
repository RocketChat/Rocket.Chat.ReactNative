import { useStore, type StoreApi } from 'zustand';

import { type TRoomOrPreview } from '../../definitions/TRoom';
import { getRoom, type RoomSnapshot } from '../roomObservation';

export interface IRoomSnapshotState {
	roomSnapshot: RoomSnapshot;
}

export interface IUseRoomResult {
	room: TRoomOrPreview;
	snapshot: RoomSnapshot;
}

export const useRoomFromStore = <S extends IRoomSnapshotState>(store: StoreApi<S>): IUseRoomResult => {
	const snapshot = useStore(store, s => s.roomSnapshot);
	return { room: getRoom(snapshot), snapshot };
};
