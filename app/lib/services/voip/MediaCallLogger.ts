import type { IMediaSignalLogger } from '@rocket.chat/media-signaling';

export class MediaCallLogger implements IMediaSignalLogger {
	log(...args: unknown[]): void {
		console.log(`[Media Call] ${JSON.stringify(args)}`);
	}

	debug(...args: unknown[]): void {
		if (__DEV__) {
			console.log(`[Media Call Debug] ${JSON.stringify(args)}`);
		}
	}

	error(...args: unknown[]): void {
		console.log(`[Media Call Error] ${JSON.stringify(args)}`);
	}

	warn(...args: unknown[]): void {
		console.log(`[Media Call Warning] ${JSON.stringify(args)}`);
	}
}
