import { Action } from 'redux';

import { ROOMS } from './actionsTypes';

export interface IRoomsRequest extends Action {
	params: any;
}

export interface ISetSearch extends Action {
	searchText: string;
}

export interface IRoomsFailure extends Action {
	err: Record<string, any> | string;
}

export type IRoomsAction = IRoomsRequest & ISetSearch & IRoomsFailure;

export function roomsRequest(
	params: {
		allData: boolean;
	} = { allData: false }
): IRoomsRequest {
	return {
		type: ROOMS.REQUEST,
		params
	};
}

export function roomsSuccess(): Action {
	return {
		type: ROOMS.SUCCESS
	};
}

export function roomsFailure(err: string): IRoomsFailure {
	return {
		type: ROOMS.FAILURE,
		err
	};
}

export function roomsRefresh(): Action {
	return {
		type: ROOMS.REFRESH
	};
}
