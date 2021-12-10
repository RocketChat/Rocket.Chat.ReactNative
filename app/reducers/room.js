import { ROOM } from '../actions/actionsTypes';

const initialState = {
	rid: null,
	isDeleting: false,
	rooms: [],
	uploadingSend: {}
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
		case ROOM.UPLOADING_SEND:
			return { ...state, uploadingSend: { ...state.uploadingSend } };
		case ROOM.UPLOADING_REMOVE:
			const uploadingSendState = Object.assign({}, state.uploadingSend);
			delete uploadingSendState[action.name];
			return { ...state, uploadingSend: { ...uploadingSendState } };
		default:
			return state;
	}
}
