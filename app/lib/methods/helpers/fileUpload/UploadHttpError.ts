import { type IGroupedError } from '../log';

export class UploadHttpError extends Error implements IGroupedError {
	readonly status: number;

	readonly serverMessage?: string;

	readonly retryAfterSeconds?: number;

	readonly groupingHash: string;

	constructor(status: number, options?: { serverMessage?: string; retryAfterSeconds?: number }) {
		super(`Error: ${status}`);
		this.name = 'UploadHttpError';
		this.status = status;
		this.serverMessage = options?.serverMessage;
		this.retryAfterSeconds = options?.retryAfterSeconds;
		this.groupingHash = `UploadHttpError:${status}`;
	}
}
