import { Action } from 'redux';

import { VOIP } from './actionsTypes';
import { VoipSession } from '../lib/voip/definitions';

type TClientError = Action & { payload: string };

type ActionWithPayload<P> = Action & { payload: P };
type TUpdateSessionAction = ActionWithPayload<VoipSession | null>;
export type TActionVoip = TUpdateSessionAction;

export function initVoip(): Action {
	return { type: VOIP.INIT };
}

export function clientError(payload: string): TClientError {
	return {
		type: VOIP.CLIENT_ERROR,
		payload
	};
}

export function incomingCall(): Action {
	return { type: VOIP.INCOMING_CALL };
}

export function accept(): Action {
	return { type: VOIP.ACCEPT_CALL };
}

export function decline(): Action {
	return { type: VOIP.DECLINE_CALL };
}

export function makeCall(): Action {
	return { type: VOIP.INCOMING_CALL };
}

export function endCall(): Action {
	return { type: VOIP.END_CALL };
}

export function sendDtmf(payload: string): ActionWithPayload<string> {
	return { type: VOIP.SEND_DTMF, payload };
}

export function mute(payload: boolean): ActionWithPayload<boolean> {
	return { type: VOIP.MUTE_CALL, payload };
}

export function hold(payload: boolean): ActionWithPayload<boolean> {
	return { type: VOIP.HOLD_CALL, payload };
}

export function transfer(payload: string): ActionWithPayload<string> {
	return { type: VOIP.HOLD_CALL, payload };
}

export function updateSession(payload: VoipSession | null): TUpdateSessionAction {
	return { type: VOIP.UPDATE_SESSION, payload };
}
