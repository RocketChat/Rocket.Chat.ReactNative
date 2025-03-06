import { TActionsRoom } from '../actions/room';
import { ROOM } from '../actions/actionsTypes';

export type IRoomRecord = string[];

export interface IRoom {
	rid: string;
	isDeleting: boolean;
	subscribedRoom: string;
	historyLoaders: string[];
}

export const initialState: IRoom = {
	rid: '',
	isDeleting: false,
	subscribedRoom: '',
	historyLoaders: []
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
		default:
			return state;
	}
}
