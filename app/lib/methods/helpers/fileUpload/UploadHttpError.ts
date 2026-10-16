export class UploadHttpError extends Error {
	readonly status: number;

	readonly serverMessage?: string;

	readonly retryAfterSeconds?: number;

	constructor(status: number, options?: { serverMessage?: string; retryAfterSeconds?: number }) {
		super(`Error: ${status}`);
		this.name = 'UploadHttpError';
		this.status = status;
		this.serverMessage = options?.serverMessage;
		this.retryAfterSeconds = options?.retryAfterSeconds;
	}
}
