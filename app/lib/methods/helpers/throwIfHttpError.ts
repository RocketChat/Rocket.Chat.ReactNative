import { HttpError } from './HttpError';
import { parseRetryAfter, parseRetryAfterFromMessage } from './retryAfter';

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

export const throwIfHttpError = (status: number, body: string, retryAfterHeader?: string | null): void => {
	if (status < 200 || status >= 300) {
		const serverMessage = parseServerMessage(body);
		throw new HttpError(status, {
			serverMessage,
			retryAfterSeconds: parseRetryAfter(retryAfterHeader) ?? parseRetryAfterFromMessage(serverMessage)
		});
	}
};
