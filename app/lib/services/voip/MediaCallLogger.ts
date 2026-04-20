import type { IMediaSignalLogger } from '@rocket.chat/media-signaling';

const formatArg = (value: unknown): string => (typeof value === 'string' ? value : JSON.stringify(value));

export const mediaCallLogger = {
	info(...args: unknown[]): void {
		if (__DEV__) {
			console.log(...args);
		}
	},
	warn(...args: unknown[]): void {
		console.warn(...args);
	},
	error(...args: unknown[]): void {
		console.error(...args);
	},
	debug(...args: unknown[]): void {
		if (__DEV__) {
			console.log(...args);
		}
	}
};

export const mediaSignalingLogger: IMediaSignalLogger = {
	log(...args: unknown[]): void {
		if (__DEV__) {
			console.log('[Media Call]', args.map(formatArg).join(' '));
		}
	},
	debug(...args: unknown[]): void {
		if (__DEV__) {
			console.log('[Media Call Debug]', args.map(formatArg).join(' '));
		}
	},
	error(...args: unknown[]): void {
		console.error('[Media Call Error]', args.map(formatArg).join(' '));
	},
	warn(...args: unknown[]): void {
		console.warn('[Media Call Warning]', args.map(formatArg).join(' '));
	}
};
