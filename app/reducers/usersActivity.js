import { ACTIVITIES } from '../actions/actionsTypes';

const initialState = {
	typing: {},
	recording: {},
	uploading: {}
};

export default function usersActivity(state = initialState, action) {
	const { type, roomId, username, activity } = action;

	switch (type) {
		case ACTIVITIES.ADD:
			if (state[activity]?.[roomId]) {
				if (state[activity][roomId].includes(username)) {
					return state;
				}
				return { ...state, [activity]: { ...state[activity], [roomId]: [...state[activity][roomId], username] } };
			} else {
				return { ...state, [activity]: { ...state[activity], [roomId]: [username] } };
			}

		case ACTIVITIES.CLEAR_ALL_USER_ACTIVITY:
			const newState = {};
			Object.keys(state).forEach(activity => {
				newState[activity] = { ...state[activity] };
				if (state[activity]?.[roomId]) {
					const filteredUsers = state[activity][roomId].filter(u => u !== username);
					newState[activity][roomId] = [...filteredUsers];
				}
			});
			return { ...newState };

		case ACTIVITIES.REMOVE_ALL_ROOM_ACTIVITIES:
			return { ...initialState };

		default:
			return state;
	}
}
