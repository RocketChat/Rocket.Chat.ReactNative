import { ROOM } from '../actions/actionsTypes';

const initialState = {
	rid: null,
	isDeleting: false,
	rooms: []
};

export default function(state = initialState, action) {
	switch (action.type) {
		case ROOM.SUBSCRIBE:
			return {
				...state,
				rooms: [action.rid, ...state.rooms]
			};
		case ROOM.UNSUBSCRIBE:
			return {
				...state,
				rooms: state.rooms
					.filter(room => room.rid === action.rid)
			};
		case ROOM.LEAVE:
			return {
				...state,
				rid: action.rid,
				isDeleting: true
			};
		case ROOM.DELETE:
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
