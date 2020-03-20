import { ROOM } from '../actions/actionsTypes';

const initialState = {
	rid: null,
	isDeleting: false
};

export default function(state = initialState, action) {
	switch (action.type) {
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
