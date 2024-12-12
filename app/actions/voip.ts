import { Action } from 'redux';

import { VOIP } from './actionsTypes';
import { VoipSession } from '../lib/voip/definitions';
import { Device } from '../lib/voip/definitions/Device';

type ActionWithPayload<P> = Action<string> & { payload: P };

export type TUpdateSessionAction = ActionWithPayload<VoipSession | null>;
export type TIncomingCallAction = ActionWithPayload<{ id: string; number: string }>;
export type TSendDTMFAction = ActionWithPayload<string>;
export type TMuteCallAction = ActionWithPayload<boolean>;
export type THoldCallAction = ActionWithPayload<boolean>;
export type TTransferCallAction = ActionWithPayload<string>;
export type TStartCallAction = ActionWithPayload<string>;
export type TClientErrorAction = ActionWithPayload<string>;
export type TChangeAudioInputDevice = ActionWithPayload<Device>;
export type TChangeAudioOutputDevice = ActionWithPayload<Device>;
export type TEndCallAction = Action;
export type TRegisterAction = Action;
export type TUnregisterAction = Action;

export type TActionVoip =
	| TUpdateSessionAction
	| TIncomingCallAction
	| TSendDTMFAction
	| TMuteCallAction
	| THoldCallAction
	| TTransferCallAction
	| TStartCallAction
	| TClientErrorAction
	| TChangeAudioInputDevice
	| TChangeAudioOutputDevice;

export function initVoip(): Action {
	return { type: VOIP.INIT };
}

export function clientError(payload: string): TClientErrorAction {
	return { type: VOIP.CLIENT_ERROR, payload };
}

export function incomingCall(payload: TIncomingCallAction['payload']): TIncomingCallAction {
	return { type: VOIP.INCOMING_CALL, payload };
}

export function accept(): Action {
	return { type: VOIP.ACCEPT_CALL };
}

export function decline(): Action {
	return { type: VOIP.DECLINE_CALL };
}

export function register(): Action {
	return { type: VOIP.REGISTER };
}

export function unregister(): Action {
	return { type: VOIP.UNREGISTER };
}

export function call(payload: TStartCallAction['payload']): TStartCallAction {
	return { type: VOIP.START_CALL, payload };
}

export function endCall(): TEndCallAction {
	return { type: VOIP.END_CALL };
}

export function sendDtmf(payload: TSendDTMFAction['payload']): TSendDTMFAction {
	return { type: VOIP.SEND_DTMF, payload };
}

export function mute(payload: TMuteCallAction['payload']): TMuteCallAction {
	return { type: VOIP.MUTE_CALL, payload };
}

export function hold(payload: THoldCallAction['payload']): THoldCallAction {
	return { type: VOIP.HOLD_CALL, payload };
}

export function transfer(payload: TTransferCallAction['payload']): TTransferCallAction {
	return { type: VOIP.HOLD_CALL, payload };
}

export function updateSession(payload: TUpdateSessionAction['payload']): TUpdateSessionAction {
	return { type: VOIP.UPDATE_SESSION, payload };
}

export function changeAudioInputDevice(payload: TChangeAudioInputDevice['payload']): TChangeAudioInputDevice {
	return { type: VOIP.CHANGE_AUDIO_INPUT_DEVICE, payload };
}

export function changeAudioOutputDevice(payload: TChangeAudioOutputDevice['payload']): TChangeAudioOutputDevice {
	return { type: VOIP.CHANGE_AUDIO_OUTPUT_DEVICE, payload };
}
