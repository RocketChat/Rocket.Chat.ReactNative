import * as types from './actionsTypes';

export function createDiscussionRequest(data) {
	return {
		type: types.CREATE_DISCUSSION.REQUEST,
		data
	};
}

export function createDiscussionSuccess(data) {
	return {
		type: types.CREATE_DISCUSSION.SUCCESS,
		data
	};
}

export function createDiscussionFailure(err) {
	return {
		type: types.CREATE_DISCUSSION.FAILURE,
		err
	};
}
