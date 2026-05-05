import type { IMediaSignalLogger } from '@rocket.chat/media-signaling';

import { voipDebugLog } from './voipDebugLogger';

export class MediaCallLogger implements IMediaSignalLogger {
	log(...args: unknown[]): void {
		voipDebugLog('mediaSignal', 'log', args);
		if (__DEV__) {
			console.log(`[Media Call] ${JSON.stringify(args)}`);
		}
	}

	debug(...args: unknown[]): void {
		voipDebugLog('mediaSignal', 'debug', args);
		if (__DEV__) {
			console.log(`[Media Call Debug] ${JSON.stringify(args)}`);
		}
	}

	error(...args: unknown[]): void {
		voipDebugLog('mediaSignal', 'error', args);
		console.error(`[Media Call Error] ${JSON.stringify(args)}`);
	}

	warn(...args: unknown[]): void {
		voipDebugLog('mediaSignal', 'warn', args);
		console.warn(`[Media Call Warning] ${JSON.stringify(args)}`);
	}
}
