import { Action } from 'redux';

import { VOIP } from './actionsTypes';
import { VoipSession, VoipState } from '../lib/voip/definitions';

type ActionWithPayload<T = string, P = {}> = Action<T> & { payload: P };

export type TUpdateSessionAction = ActionWithPayload<'VOIP_UPDATE_SESSION', VoipSession | null>;

export type TUpdateStateAction = ActionWithPayload<'VOIP_UPDATE_STATE', VoipState | null>;
export type TStartCallAction = ActionWithPayload<'VOIP_START_CALL', string>;
export type TClientErrorAction = ActionWithPayload<'VOIP_CLIENT_ERROR', string>;
export type TRegisterAction = Action<'VOIP_REGISTER'>;
export type TUnregisterAction = Action<'VOIP_UNREGISTER'>;
export type TUpdateRegisterStatusAction = ActionWithPayload<
	'VOIP_UPDATE_REGISTER_STATUS',
	'REGISTERED' | 'UNREGISTERED' | 'REGISTERING' | 'UNREGISTERING'
>;

export type TActionVoip =
	| TUpdateSessionAction
	| TStartCallAction
	| TClientErrorAction
	| TUpdateStateAction
	| TRegisterAction
	| TUpdateRegisterStatusAction;

export function initVoip(): Action {
	return { type: VOIP.INIT };
}

export function clientError(payload: string): TClientErrorAction {
	return { type: VOIP.CLIENT_ERROR, payload };
}

export function register(): Action {
	return { type: VOIP.REGISTER };
}

export function unregister(): Action {
	return { type: VOIP.UNREGISTER };
}

export function startCall(payload: TStartCallAction['payload']): TStartCallAction {
	return { type: VOIP.START_CALL, payload };
}

export function updateSession(payload: TUpdateSessionAction['payload']): TUpdateSessionAction {
	return { type: VOIP.UPDATE_SESSION, payload };
}

export function updateState(payload: TUpdateStateAction['payload']): TUpdateStateAction {
	return { type: VOIP.UPDATE_STATE, payload };
}

export function updateRegisterStatus(payload: TUpdateRegisterStatusAction['payload']): TUpdateRegisterStatusAction {
	return { type: VOIP.UPDATE_REGISTER_STATUS, payload };
}
