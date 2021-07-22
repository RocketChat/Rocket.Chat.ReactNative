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
	const {
		activity,
		type,
		roomId,
		username
	} = action;

	switch (type) {
		case USER_TYPING.ADD:
		case USER_RECORDING.ADD:
		case USER_UPLOADING.ADD:
			if (state[activity]?.[roomId]) {
				if (state[activity][roomId].includes(username)) {
					return state;
				}
				return { ...state, [activity]: { ...state[activity], [roomId]: [...state[activity][roomId], username] } };
			} else {
				return { ...state, [activity]: { ...state[activity], [roomId]: [username] } };
			}

		case USER_TYPING.REMOVE:
		case USER_RECORDING.REMOVE:
		case USER_UPLOADING.REMOVE:
			if (state[activity]?.[roomId]) {
				const filteredUsers = state[activity][roomId].filter(u => u !== username);
				return { ...state, [activity]: { ...state[activity], [roomId]: [...filteredUsers] } };
			}
			return state;

		case CLEAR_ALL_USER_ACTIVITY:
			return { ...initialState };

		default:
			return state;
	}
}
