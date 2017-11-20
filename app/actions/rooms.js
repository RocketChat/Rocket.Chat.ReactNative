import * as types from './actionsTypes';


export function roomsRequest() {
	return {
		type: types.ROOMS.REQUEST
	};
}

export function roomsSuccess() {
	return {
		type: types.ROOMS.SUCCESS
	};
}

export function roomsFailure(err) {
	return {
		type: types.ROOMS.FAILURE,
		err
	};
}

export function openRoom({ rid }) {
	return {
		type: types.ROOMS.OPEN,
		rid
	};
}
