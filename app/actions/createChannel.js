import * as types from './actionsTypes';

export function createChannelRequest(data) {
	return {
		type: types.CREATE_CHANNEL.REQUEST,
		data
	};
}

export function createChannelSuccess(data) {
	return {
		type: types.CREATE_CHANNEL.SUCCESS,
		data
	};
}

export function createChannelFailure(err) {
	return {
		type: types.CREATE_CHANNEL.FAILURE,
		err
	};
}
