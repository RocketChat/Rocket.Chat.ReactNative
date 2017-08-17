import * as types from './actionsTypes';

export function roomsSuccessRequest() {
	return {
		type: types.ROOMS.REQUEST
	};
}

export function roomsSuccess() {
	return {
		type: types.ROOMS.SUCCESS
	};
}

export function roomsSuccessFailure(err) {
	return {
		type: types.ROOMS.FAILURE,
		err
	};
}
