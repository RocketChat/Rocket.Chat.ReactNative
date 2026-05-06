import { type TActionsRoom } from '../actions/room';
import { ROOM } from '../actions/actionsTypes';

export type IRoomRecord = string[];

export interface IRoom {
	rid: string;
	isDeleting: boolean;
	subscribedRoom: string;
	historyLoaders: string[];
	/** Room id while loading an extra history batch (e.g. filling the page after hidden system messages). */
	historyBatchFetchingRid: string | null;
}

export const initialState: IRoom = {
	rid: '',
	isDeleting: false,
	subscribedRoom: '',
	historyLoaders: [],
	historyBatchFetchingRid: null
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
				rid: action.room.rid,
				isDeleting: true
			};
		case ROOM.DELETE:
			return {
				...state,
				rid: action.room.rid,
				isDeleting: true
			};
		case ROOM.CLOSE:
			return {
				...state,
				rid: action.rid,
				isDeleting: true
			};
		case ROOM.FORWARD:
			return {
				...state,
				rid: action.rid,
				isDeleting: true
			};
		case ROOM.REMOVED:
			return {
				...state,
				isDeleting: false
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
		case ROOM.HISTORY_BATCH_FETCH_START:
			return {
				...state,
				historyBatchFetchingRid: action.rid
			};
		case ROOM.HISTORY_BATCH_FETCH_END:
			return {
				...state,
				historyBatchFetchingRid: null
			};
		default:
			return state;
	}
}
