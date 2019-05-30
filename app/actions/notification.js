import * as types from './actionsTypes';

export function notificationReceived(params) {
	return {
		type: types.NOTIFICATION.RECEIVED,
		payload: {
			message: params.text,
			payload: params.payload
		}
	};
}

export function removeNotification(payload) {
	return {
		type: types.NOTIFICATION.REMOVE,
		payload
	};
}
