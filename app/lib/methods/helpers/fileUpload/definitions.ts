import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';

export type TUploadHeaders = Record<string, string | undefined>;

export interface IFormData {
	name: string;
	uri?: string;
	type?: string;
	filename?: string;
	data?: any;
}

export interface IFileUpload {
	send(): Promise<TRoomsMediaResponse>;
	cancel(): void;
}

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

export const parseServerMessage = (responseText?: string): string | undefined => {
	if (!responseText) {
		return undefined;
	}
	try {
		const parsed = JSON.parse(responseText);
		const serverMessage = parsed?.error ?? parsed?.message;
		return typeof serverMessage === 'string' && serverMessage.length > 0 ? serverMessage : undefined;
	} catch {
		return undefined;
	}
};

export const parseRetryAfter = (value?: string | null): number | undefined => {
	if (!value) {
		return undefined;
	}
	const seconds = Number(value);
	if (Number.isFinite(seconds)) {
		return seconds > 0 ? seconds : undefined;
	}
	const timestamp = Date.parse(value);
	if (Number.isNaN(timestamp)) {
		return undefined;
	}
	const delta = Math.ceil((timestamp - Date.now()) / 1000);
	return delta > 0 ? delta : undefined;
};

export const getRetryAfterFromHeaders = (headers?: Record<string, string>): number | undefined => {
	if (!headers) {
		return undefined;
	}
	const key = Object.keys(headers).find(name => name.toLowerCase() === 'retry-after');
	return key ? parseRetryAfter(headers[key]) : undefined;
};

const WAIT_SECONDS_PATTERN = /wait (\d+) seconds/i;

export const parseRetryAfterFromMessage = (message?: string): number | undefined => {
	const seconds = Number(message?.match(WAIT_SECONDS_PATTERN)?.[1]);
	return seconds > 0 ? seconds : undefined;
};
