import { USERS_ACTIVITY } from '../actions/actionsTypes';

/**
 * The state could be
 * {
 *	roomId?: {
 *		username: action
 *	},
 *	tmid?: {
 *		username: action
 *	}
 * }
 */

const initialState = {};

export default function usersActivity(state = initialState, action) {
	const { type, roomId, username, activity } = action;

	switch (type) {
		case USERS_ACTIVITY.ADD:
			if (state[roomId]) {
				const obj = state[roomId];
				delete obj[username];
				return { ...state, [roomId]: { [username]: activity, ...obj } };
			}
			const add = {};
			add[roomId] = { [username]: activity };
			return { ...state, ...add };

		case USERS_ACTIVITY.CLEAR_USER_ACTIVITY:
			const newState = Object.assign({}, state);
			// We need to do this to delete correctly the roomId
			const newRoomId = Object.assign({}, newState[roomId]);
			delete newRoomId[username];
			if (!Object.keys(newRoomId).length) {
				delete newState[roomId];
				return newState;
			}
			return { ...newState, ...{ [roomId]: newRoomId } };

		case USERS_ACTIVITY.REMOVE_ROOM_USERS_ACTIVITY:
			const copyState = Object.assign({}, state);
			if (copyState.hasOwnProperty(roomId)) {
				delete copyState[roomId];
			}
			return copyState;

		default:
			return state;
	}
}
