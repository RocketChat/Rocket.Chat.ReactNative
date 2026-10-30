import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { UploadHttpError } from './fileUpload/UploadHttpError';

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

export const throwIfUploadFailed = (status: number, body: string, retryAfterSeconds?: number): void => {
	if (status < 200 || status >= 300) {
		throw new UploadHttpError(status, { serverMessage: parseServerMessage(body), retryAfterSeconds });
	}
};

export const parseUploadResponse = (status: number, body: string, retryAfterSeconds?: number): TRoomsMediaResponse => {
	throwIfUploadFailed(status, body, retryAfterSeconds);
	try {
		return JSON.parse(body);
	} catch {
		throw new Error('Upload failed: invalid server response');
	}
};
