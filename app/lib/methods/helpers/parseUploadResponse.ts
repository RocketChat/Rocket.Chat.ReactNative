import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { HttpError } from './HttpError';
import { parseRetryAfterFromMessage } from './retryAfter';

const parseServerMessage = (responseText?: string): string | undefined => {
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

export const throwIfHttpError = (status: number, body: string, retryAfterSeconds?: number): void => {
	if (status < 200 || status >= 300) {
		const serverMessage = parseServerMessage(body);
		throw new HttpError(status, {
			serverMessage,
			retryAfterSeconds: retryAfterSeconds ?? parseRetryAfterFromMessage(serverMessage)
		});
	}
};

export const parseUploadResponse = (status: number, body: string, retryAfterSeconds?: number): TRoomsMediaResponse => {
	throwIfHttpError(status, body, retryAfterSeconds);
	try {
		return JSON.parse(body);
	} catch {
		throw new Error('Upload failed: invalid server response');
	}
};
