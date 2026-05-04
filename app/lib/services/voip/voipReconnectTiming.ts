import { voipDebugLog } from './voipDebugLogger';

let acceptedAt: number | null = null;
let firstSignalLogged = false;

export const markVoipReconnectStart = (forced: boolean) => {
	acceptedAt = Date.now();
	firstSignalLogged = false;
	voipDebugLog('reconnect-timing', 'accept marked', { t: acceptedAt, forced });
};

export const logVoipLoginElapsed = () => {
	if (acceptedAt == null) return;
	const ms = Date.now() - acceptedAt;
	voipDebugLog('reconnect-timing', 'login ready', { ms });
};

export const logVoipFirstSignalElapsed = () => {
	if (acceptedAt == null || firstSignalLogged) return;
	firstSignalLogged = true;
	const ms = Date.now() - acceptedAt;
	voipDebugLog('reconnect-timing', 'first signal sent', { ms });
};

export const clearVoipReconnectTiming = () => {
	acceptedAt = null;
	firstSignalLogged = false;
};
