import { NOTIFICATION } from './actionsTypes';

export function notificationReceived(params) {
	return {
		type: NOTIFICATION.RECEIVED,
		payload: {
			title: params.title,
			avatar: params.avatar,
			message: params.text,
			payload: params.payload
		}
	};
}

export function removeNotification() {
	return {
		type: NOTIFICATION.REMOVE
	};
}
