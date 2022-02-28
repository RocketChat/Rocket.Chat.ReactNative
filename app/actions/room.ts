import { Action } from 'redux';

import { ERoomType } from '../definitions/ERoomType';
import { ROOM } from './actionsTypes';

// TYPE RETURN RELATED
type ISelected = Record<string, string>;

export interface ITransferData {
	roomId: string;
	userId?: string;
	departmentId?: string;
}

// ACTION RETURN RELATED
interface IBaseReturn extends Action {
	rid: string;
}

type TSubscribeRoom = IBaseReturn;
type TUnsubscribeRoom = IBaseReturn;
type TCloseRoom = IBaseReturn;

type TRoom = Record<string, any>;

interface ILeaveRoom extends Action {
	roomType: ERoomType;
	room: TRoom;
	selected?: ISelected;
}

interface IDeleteRoom extends Action {
	roomType: ERoomType;
	room: TRoom;
	selected?: ISelected;
}

interface IForwardRoom extends Action {
	transferData: ITransferData;
	rid: string;
}

interface IUserTyping extends Action {
	rid: string;
	status: boolean;
}

export type TActionsRoom = TSubscribeRoom & TUnsubscribeRoom & TCloseRoom & ILeaveRoom & IDeleteRoom & IForwardRoom & IUserTyping;

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

export function closeRoom(rid: string): TCloseRoom {
	return {
		type: ROOM.CLOSE,
		rid
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
