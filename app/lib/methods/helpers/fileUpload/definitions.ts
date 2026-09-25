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

	readonly body?: string;

	readonly retryAfterSeconds?: number;

	constructor(status: number, options?: { serverMessage?: string; body?: string; retryAfterSeconds?: number }) {
		super(`Error: ${status}`);
		this.name = 'UploadHttpError';
		this.status = status;
		if (options?.serverMessage) {
			this.serverMessage = options.serverMessage;
		}
		if (options?.body) {
			this.body = options.body;
		}
		if (options?.retryAfterSeconds) {
			this.retryAfterSeconds = options.retryAfterSeconds;
		}
	}
}

const MAX_ERROR_BODY_LENGTH = 500;

export const parseUploadErrorBody = (responseText: string | undefined): { serverMessage?: string; body?: string } => {
	if (!responseText) {
		return {};
	}
	const body = responseText.slice(0, MAX_ERROR_BODY_LENGTH);
	const looksLikeJson = /^[[{]/.test(responseText.trimStart());
	if (!looksLikeJson) {
		return { body };
	}
	try {
		const parsed = JSON.parse(responseText);
		const serverMessage = parsed?.error ?? parsed?.message;
		if (typeof serverMessage === 'string' && serverMessage.length > 0) {
			return { serverMessage: serverMessage.slice(0, MAX_ERROR_BODY_LENGTH), body };
		}
	} catch {}
	return { body };
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

const WAIT_SECONDS_PATTERN = /wait (\d+) seconds/;

export const parseRetryAfterFromMessage = (message?: string): number | undefined => {
	const seconds = Number(message?.match(WAIT_SECONDS_PATTERN)?.[1]);
	return seconds > 0 ? seconds : undefined;
};
