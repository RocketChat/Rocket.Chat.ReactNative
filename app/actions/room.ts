import type { Action } from 'redux';

import { ERoomType, type RoomType } from '../definitions';
import { ROOM } from './actionsTypes';

// TYPE RETURN RELATED
type ISelected = string[];

export interface ITransferData {
	roomId: string;
	userId?: string;
	departmentId?: string;
}

// ACTION RETURN RELATED
type IBaseReturn = Action & { rid: string; }

type TSubscribeRoom = IBaseReturn;
type TUnsubscribeRoom = IBaseReturn;

type TRoom = Record<string, any>;

type ILeaveRoom = Action & { roomType: ERoomType;
	room: TRoom;
	selected?: ISelected; }

type IDeleteRoom = Action & {
	roomType: ERoomType;
	room: TRoom;
	selected?: ISelected;
}

type IForwardRoom = Action & { transferData: ITransferData;
	rid: string; }

type IUserTyping = Action & { rid: string;
	status: boolean; }

export type IRoomHistoryRequest = Action & { rid: string;
	t: RoomType;
	loaderId: string; }

export type IRoomHistoryFinished = Action & { loaderId: string; }

export type TActionsRoom = TSubscribeRoom &
	TUnsubscribeRoom &
	ILeaveRoom &
	IDeleteRoom &
	IForwardRoom &
	IUserTyping &
	IRoomHistoryRequest &
	IRoomHistoryFinished;

export function subscribeRoom(rid: string): TSubscribeRoom {
	return {
		type: ROOM.SUBSCRIBE,
		rid
	};
}

export function unsubscribeRoom(rid: string): TUnsubscribeRoom {
	return {
		type: ROOM.UNSUBSCRIBE,
		rid
	};
}

export function leaveRoom(roomType: ERoomType, room: TRoom, selected?: ISelected): ILeaveRoom {
	return {
		type: ROOM.LEAVE,
		room,
		roomType,
		selected
	};
}

export function deleteRoom(roomType: ERoomType, room: TRoom, selected?: ISelected): IDeleteRoom {
	return {
		type: ROOM.DELETE,
		room,
		roomType,
		selected
	};
}

export function forwardRoom(rid: string, transferData: ITransferData): IForwardRoom {
	return {
		type: ROOM.FORWARD,
		transferData,
		rid
	};
}

export function removedRoom(): Action {
	return {
		type: ROOM.REMOVED
	};
}

export function userTyping(rid: string, status = true): IUserTyping {
	return {
		type: ROOM.USER_TYPING,
		rid,
		status
	};
}

export function roomHistoryRequest({ rid, t, loaderId }: { rid: string; t: RoomType; loaderId: string }): IRoomHistoryRequest {
	return {
		type: ROOM.HISTORY_REQUEST,
		rid,
		t,
		loaderId
	};
}

export function roomHistoryFinished({ loaderId }: { loaderId: string }): IRoomHistoryFinished {
	return {
		type: ROOM.HISTORY_FINISHED,
		loaderId
	};
}
