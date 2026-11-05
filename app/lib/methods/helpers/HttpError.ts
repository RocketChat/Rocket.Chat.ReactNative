import { type IGroupedError } from './log';

export class HttpError extends Error implements IGroupedError {
	readonly status: number;

	readonly serverMessage?: string;

	readonly retryAfterSeconds?: number;

	readonly groupingHash: string;

	constructor(status: number, options?: { serverMessage?: string; retryAfterSeconds?: number }) {
		super(`Error: ${status}`);
		this.name = 'HttpError';
		this.status = status;
		this.serverMessage = options?.serverMessage;
		this.retryAfterSeconds = options?.retryAfterSeconds;
		this.groupingHash = `HttpError:${status}`;
	}
}
