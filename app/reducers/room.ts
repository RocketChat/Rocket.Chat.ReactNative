import { TActionsRoom } from '../actions/room';
import { ROOM } from '../actions/actionsTypes';

export type IRoomRecord = string[];

export interface IRoom {
	rid: string;
	isDeleting: boolean;
	subscribed: string;
}

export const initialState: IRoom = {
	rid: '',
	isDeleting: false,
	subscribed: ''
};

export default function (state = initialState, action: TActionsRoom): IRoom {
	switch (action.type) {
		case ROOM.SUBSCRIBE:
			return {
				...state,
				subscribed: action.rid
			};
		case ROOM.UNSUBSCRIBE:
			return {
				...state,
				subscribed: state.subscribed === action.rid ? '' : state.subscribed
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
		default:
			return state;
	}
}
