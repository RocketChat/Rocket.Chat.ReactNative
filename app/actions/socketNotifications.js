import * as types from './actionsTypes';

export function toggleSocketNotifications(value) {
	return {
		type: types.TOGGLE_SOCKET_NOTIFICATIONS,
		payload: value
	};
}
