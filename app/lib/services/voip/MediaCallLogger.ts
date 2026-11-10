import type { IMediaSignalLogger } from '@rocket.chat/media-signaling';

import { voipDebugLog } from './voipDebugLog';

function record(level: 'log' | 'debug' | 'warn' | 'error', args: unknown[]): void {
	const [first, ...rest] = args;
	const message = typeof first === 'string' ? first : '';
	const data = typeof first === 'string' ? rest : args;
	voipDebugLog('MediaCall', message, data.length ? data : undefined, level);
}

export class MediaCallLogger implements IMediaSignalLogger {
	log(...args: unknown[]): void {
		record('log', args);
		if (__DEV__) {
			console.log(`[Media Call] ${JSON.stringify(args)}`);
		}
	}

	debug(...args: unknown[]): void {
		record('debug', args);
		if (__DEV__) {
			console.log(`[Media Call Debug] ${JSON.stringify(args)}`);
		}
	}

	error(...args: unknown[]): void {
		record('error', args);
		console.error(`[Media Call Error] ${JSON.stringify(args)}`);
	}

	warn(...args: unknown[]): void {
		record('warn', args);
		console.warn(`[Media Call Warning] ${JSON.stringify(args)}`);
	}
}
