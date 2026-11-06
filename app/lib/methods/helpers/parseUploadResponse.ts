import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { throwIfHttpError } from './throwIfHttpError';

export const parseUploadResponse = (status: number, body: string, retryAfterHeader?: string | null): TRoomsMediaResponse => {
	throwIfHttpError(status, body, retryAfterHeader);
	try {
		return JSON.parse(body);
	} catch {
		throw new Error('Upload failed: invalid server response');
	}
};
