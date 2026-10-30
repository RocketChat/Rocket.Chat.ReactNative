import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { UploadHttpError } from './fileUpload/UploadHttpError';

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

export const parseUploadResponse = (status: number, body: string, retryAfterSeconds?: number): TRoomsMediaResponse => {
	if (status < 200 || status >= 300) {
		throw new UploadHttpError(status, { serverMessage: parseServerMessage(body), retryAfterSeconds });
	}
	try {
		return JSON.parse(body);
	} catch {
		throw new Error('Upload failed: invalid server response');
	}
};
