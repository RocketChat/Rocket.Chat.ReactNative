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

	constructor(status: number, options?: { serverMessage?: string; body?: string }) {
		super(`Error: ${status}`);
		this.name = 'UploadHttpError';
		this.status = status;
		if (options?.serverMessage) {
			this.serverMessage = options.serverMessage;
		}
		if (options?.body) {
			this.body = options.body;
		}
	}
}

const MAX_ERROR_BODY_LENGTH = 500;

export const parseUploadErrorBody = (responseText: string | undefined): { serverMessage?: string; body?: string } => {
	if (!responseText) {
		return {};
	}
	const body = responseText.slice(0, MAX_ERROR_BODY_LENGTH);
	try {
		const parsed = JSON.parse(responseText);
		const serverMessage = parsed?.error ?? parsed?.message;
		if (typeof serverMessage === 'string' && serverMessage.length > 0) {
			return { serverMessage, body };
		}
	} catch {}
	return { body };
};
