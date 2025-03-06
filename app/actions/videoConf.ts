import { Action } from 'redux';

import { ICallInfo } from '../reducers/videoConf';
import { VIDEO_CONF } from './actionsTypes';

interface IHandleVideoConfIncomingWebsocketMessages extends Action {
	data: any;
}

export type TCallProps = { mic: boolean; cam: boolean; direct: boolean; rid: string; uid: string };
type TInitCallAction = Action & { payload: TCallProps };
type TSetCallingAction = Action & { payload: boolean };
type TCancelCallAction = Action & { payload: { callId?: string } };
type TAcceptCallAction = Action & { payload: { callId: string } };

export interface IVideoConfGenericAction extends Action {
	payload: ICallInfo;
}

export type TActionVideoConf = IHandleVideoConfIncomingWebsocketMessages &
	IVideoConfGenericAction &
	TSetCallingAction &
	Action &
	TInitCallAction &
	TCancelCallAction &
	TAcceptCallAction;

export function handleVideoConfIncomingWebsocketMessages(data: any): IHandleVideoConfIncomingWebsocketMessages {
	return {
		type: VIDEO_CONF.HANDLE_INCOMING_WEBSOCKET_MESSAGES,
		data
	};
}

export function setVideoConfCall(payload: ICallInfo): IVideoConfGenericAction {
	return {
		type: VIDEO_CONF.SET,
		payload
	};
}

export function removeVideoConfCall(payload: ICallInfo): IVideoConfGenericAction {
	return {
		type: VIDEO_CONF.REMOVE,
		payload
	};
}

export function clearVideoConfCalls(): Action {
	return {
		type: VIDEO_CONF.CLEAR
	};
}

export function initVideoCall(payload: TCallProps): TInitCallAction {
	return {
		type: VIDEO_CONF.INIT_CALL,
		payload
	};
}

export function cancelCall(payload: { callId?: string }): TCancelCallAction {
	return {
		type: VIDEO_CONF.CANCEL_CALL,
		payload
	};
}

export function acceptCall(payload: { callId: string }): TAcceptCallAction {
	return {
		type: VIDEO_CONF.ACCEPT_CALL,
		payload
	};
}

export function setCalling(payload: boolean): TSetCallingAction {
	return {
		type: VIDEO_CONF.SET_CALLING,
		payload
	};
}
