import * as types from './actionsTypes';

export function createTeamRequest(data) {
	return {
		type: types.CREATE_TEAM.REQUEST,
		data
	};
}

export function createTeamSuccess(data) {
	return {
		type: types.CREATE_TEAM.SUCCESS,
		data
	};
}

export function createTeamFailure(err) {
	return {
		type: types.CREATE_TEAM.FAILURE,
		err
	};
}
