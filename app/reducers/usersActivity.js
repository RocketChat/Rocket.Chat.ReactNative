import { USERS_RECORDING, USERS_TYPING, USERS_UPLOADING } from '../actions/actionsTypes';

const initialState = {
	typing: [],
	recording: [],
	uploading: []
};

export default function usersActivity(state = initialState, action) {
	switch (action.type) {
		case USERS_TYPING.ADD:
			if (!state.typing.includes(action.username)) {
				return { ...state, typing: [...state.typing, action.username] };
			}
			return state;
		case USERS_RECORDING.ADD:
			if (!state.recording.includes(action.username)) {
				return { ...state, recording: [...state.recording, action.username] };
			}
			return state;
		case USERS_UPLOADING.ADD:
			if (!state.uploading.includes(action.username)) {
				return { ...state, uploading: [...state.uploading, action.username] };
			}
			return state;
		case USERS_TYPING.REMOVE:
			return { ...state, typing: state.typing.filter(item => item !== action.username) };
		case USERS_RECORDING.REMOVE:
			return { ...state, recording: state.recording.filter(item => item !== action.username) };
		case USERS_UPLOADING.REMOVE:
			return { ...state, uploading: state.uploading.filter(item => item !== action.username) };
		case USERS_TYPING.CLEAR:
			return { ...state, typing: initialState.typing };
		case USERS_RECORDING.CLEAR:
			return { ...state, recording: initialState.recording };
		case USERS_UPLOADING.CLEAR:
			return { ...state, uploading: initialState.uploading };
		default:
			return state;
	}
}
