import { ROOM } from '../actions/actionsTypes';

const initialState = {
	rid: null,
	isDeleting: false,
	rooms: [],
	threads: [],
	performingActions: []
};

export default function (state = initialState, action) {
	switch (action.type) {
		case ROOM.SUBSCRIBE:
			return {
				...state,
				rooms: [action.rid, ...state.rooms]
			};
		case ROOM.UNSUBSCRIBE:
			return {
				...state,
				rooms: state.rooms.filter(rid => rid !== action.rid)
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
		case ROOM.USER_TYPING:
		case ROOM.USER_UPLOADING:
		case ROOM.USER_RECORDING:
			if (state.performingActions.includes(action.activity)) {
				return { ...state };
			}
			return { ...state, performingActions: [...state.performingActions, action.activity] };
		case ROOM.REMOVE_ACTIVITY:
			return { ...state, performingActions: [...state.performingActions.filter(activity => activity !== action.activity)] };
		default:
			return state;
	}
}
