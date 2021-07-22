import {
	USER_RECORDING,
	USER_TYPING,
	USER_UPLOADING,
	CLEAR_ALL_USER_ACTIVITY
} from '../actions/actionsTypes';

const initialState = {
	typing: {},
	recording: {},
	uploading: {}
};

export default function usersActivity(state = initialState, action) {
	switch (action.type) {
		case USER_TYPING.ADD:
			if (action.roomId in state.typing) {
				if (state.typing[action.roomId].includes(action.username)) {
					return state;
				}
				return { ...state, typing: { ...state.typing, [action.roomId]: [...state.typing[action.roomId], action.username] } };
			} else {
				return { ...state, typing: { ...state.typing, [action.roomId]: [action.username] } };
			}
			// if (!(action.roomId in state.typing) || !(action.username in state.typing[action.roomId])) {
			// 	const typingUsers = { [action.roomId]: [...state.typing[action.roomId], action.username] };
			// 	return { ...state, typing: { ...state.typing, ...typingUsers } };
			// }
		case USER_RECORDING.ADD:
			if (action.roomId in state.recording) {
				if (state.recording[action.roomId].includes(action.username)) {
					return state;
				}
				return { ...state, recording: { ...state.recording, [action.roomId]: [...state.recording[action.roomId], action.username] } };
			} else {
				return { ...state, recording: { ...state.recording, [action.roomId]: [action.username] } };
			}
		case USER_UPLOADING.ADD:
			if (action.roomId in state.uploading) {
				if (state.uploading[action.roomId].includes(action.username)) {
					return state;
				}
				return { ...state, uploading: { ...state.uploading, [action.roomId]: [...state.uploading[action.roomId], action.username] } };
			} else {
				return { ...state, uploading: { ...state.uploading, [action.roomId]: [action.username] } };
			}
		case USER_TYPING.REMOVE:
			if (action.roomId in state.typing) {
				const filteredUsers = state.typing[action.roomId].filter(username => username !== action.username);
				return { ...state, typing: { ...state.typing, [action.roomId]: [...filteredUsers] } };
			}
			return state;
		case USER_RECORDING.REMOVE:
			if (action.roomId in state.recording) {
				const filteredUsers = state.recording[action.roomId].filter(username => username !== action.username);
				return { ...state, recording: { ...state.recording, [action.roomId]: [...filteredUsers] } };
			}
			return state;
		case USER_UPLOADING.REMOVE:
			if (action.roomId in state.uploading) {
				const filteredUsers = state.uploading[action.roomId].filter(username => username !== action.username);
				return { ...state, uploading: { ...state.uploading, [action.roomId]: [...filteredUsers] } };
			}
			return state;
		case CLEAR_ALL_USER_ACTIVITY:
			return { ...initialState };
		default:
			return state;
	}
}
