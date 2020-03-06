import { ROOM } from '../actions/actionsTypes';

const initialState = {
	rid: null,
	isDeleting: false
};

export default function(state = initialState, action) {
	switch (action.type) {
		case ROOM.DELETE_INIT:
			return {
				...state,
				rid: action.rid,
				isDeleting: true
			};
		case ROOM.DELETE_FINISH:
			return {
				...state,
				isDeleting: false
			};
		default:
			return state;
	}
}
