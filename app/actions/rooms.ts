import { type Action } from 'redux';

import { ROOMS } from './actionsTypes';
import { type IRecentRoomsStore } from '../reducers/rooms';

export interface IRoomsRequest extends Action {
	params: any;
}

export interface ISetSearch extends Action {
	searchText: string;
}

export interface IRoomsFailure extends Action {
	err: Record<string, any> | string;
}

export interface IRoomsLastVisited extends Action {
	lastVisitedRoomId: string;
	lastVisitedRoomName: string;
}

export interface IRecentRooms extends Action {
	recentRooms: IRecentRoomsStore[];
}

export type IRoomsAction = IRoomsRequest & ISetSearch & IRoomsFailure & IRoomsLastVisited & IRecentRooms;

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

export function roomsStoreLastVisited(rid: string, name: string): IRoomsLastVisited {
	return {
		type: ROOMS.STORE_LAST_VISITED,
		lastVisitedRoomId: rid,
		lastVisitedRoomName: name
	};
}

export function roomsStoreRecentRooms(recentRooms: IRecentRoomsStore[]): IRecentRooms {
	return {
		type: ROOMS.STORE_RECENT_ROOMS,
		recentRooms
	};
}
