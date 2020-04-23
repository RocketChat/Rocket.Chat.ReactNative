import { ROOM } from '../actions/actionsTypes';

const initialState = {
	rid: null,
	isDeleting: false
};

export default function(state = initialState, action) {
	switch (action.type) {
		case ROOM.SUBSCRIBE:
			return {
				...state,
				rid: action.rid
			};
		case ROOM.UNSUBSCRIBE:
			return {
				...state,
				rid: null
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
