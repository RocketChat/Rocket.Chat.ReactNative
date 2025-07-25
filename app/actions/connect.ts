import { Action } from 'redux';

import * as types from './actionsTypes';

export function connectRequest(): Action {
	return {
		type: types.METEOR.REQUEST
	};
}

export function connectSuccess(): Action {
	return {
		type: types.METEOR.SUCCESS
	};
}

export function disconnect(): Action {
	return {
		type: types.METEOR.DISCONNECT
	};
}
