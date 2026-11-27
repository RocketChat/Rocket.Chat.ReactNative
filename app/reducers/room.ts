import { type TActionsRoom } from '../actions/room';
import { ROOM } from '../actions/actionsTypes';

export type IRoomRecord = string[];

export interface IRoom {
	removalsInFlight: Record<string, number>;
	subscribedRoom: string;
	historyLoaders: string[];
}

export const initialState: IRoom = {
	removalsInFlight: {},
	subscribedRoom: '',
	historyLoaders: []
};

const startRemoval = (removalsInFlight: IRoom['removalsInFlight'], rid: string) => ({
	...removalsInFlight,
	[rid]: (removalsInFlight[rid] ?? 0) + 1
});

const finishRemoval = (removalsInFlight: IRoom['removalsInFlight'], rid: string) => {
	const { [rid]: count = 0, ...others } = removalsInFlight;
	return count > 1 ? { ...others, [rid]: count - 1 } : others;
};

export default function (state = initialState, action: TActionsRoom): IRoom {
	switch (action.type) {
		case ROOM.SUBSCRIBE:
			return {
				...state,
				subscribedRoom: action.rid
			};
		case ROOM.UNSUBSCRIBE:
			return {
				...state,
				subscribedRoom: state.subscribedRoom === action.rid ? '' : state.subscribedRoom
			};
		case ROOM.LEAVE:
			return {
				...state,
				removalsInFlight: startRemoval(state.removalsInFlight, action.room.rid)
			};
		case ROOM.DELETE:
		case ROOM.FORWARD:
			return {
				...state,
				removalsInFlight: startRemoval(state.removalsInFlight, action.rid)
			};
		case ROOM.REMOVAL_FINISHED:
			return {
				...state,
				removalsInFlight: finishRemoval(state.removalsInFlight, action.rid)
			};
		case ROOM.HISTORY_REQUEST:
			return {
				...state,
				historyLoaders: [...state.historyLoaders, action.loaderId]
			};
		case ROOM.HISTORY_FINISHED:
			return {
				...state,
				historyLoaders: state.historyLoaders.filter(loaderId => loaderId !== action.loaderId)
			};
		case ROOM.HISTORY_UI_LOADER_PUSH:
			return {
				...state,
				historyLoaders: state.historyLoaders.includes(action.loaderId)
					? state.historyLoaders
					: [...state.historyLoaders, action.loaderId]
			};
		case ROOM.HISTORY_UI_LOADER_POP:
			return {
				...state,
				historyLoaders: state.historyLoaders.filter(loaderId => loaderId !== action.loaderId)
			};
		default:
			return state;
	}
}
