import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { UploadHttpError } from './fileUpload/UploadHttpError';
import { parseServerMessage } from './parseServerMessage';

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
