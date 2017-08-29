import * as types from './actionsTypes';

export function messagesRequest({ rid }) {
	console.log(types.MESSAGES.REQUEST, rid);
	return {
		type: types.MESSAGES.REQUEST,
		rid
	};
}

export function messagesSuccess() {
	return {
		type: types.MESSAGES.SUCCESS
	};
}

export function messagesFailure(err) {
	return {
		type: types.MESSAGES.FAILURE,
		err
	};
}
